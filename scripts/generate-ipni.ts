import fs from 'fs/promises'
import path from 'node:path'
import { glob } from 'glob'
import { CID } from 'multiformats'
import { base36 } from 'multiformats/bases/base36'

import type { BlockView } from 'multiformats/block/interface'
import { privateKeyFromProtobuf, generateKeyPair } from '@libp2p/crypto/keys'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'

import { Advertisement, AdvertisementHead, EntryChunk, Provider, Protocol, CHUNK_THRESHOLD } from 'js-ipni'

import site from '../src/lib/site.json' with { type: 'json' }

const webHost = new URL(site.baseUrl).host

const distDir = path.resolve('build')
const blocksDir = path.join(distDir, 'ipfs')
const advertDir = path.join(distDir, 'ipni', 'v1', 'ad')

const loadKey = async () => {
  const b64Key = process.env.IPFS_PRIVATE_KEY

  if (b64Key) {
    return privateKeyFromProtobuf(Buffer.from(b64Key, 'base64'))
  } else {
    console.warn('⚠️ WARNING: Using random keypair. This is probably not what you want.')
    return await generateKeyPair('Ed25519')
  }
}

const privKey = await loadKey()

const peerId = peerIdFromPrivateKey(privKey)

const IPFS_CONTEXT = new TextEncoder().encode('/ipfs')

export const generate = async () => {
  console.log(`🌌 Generating updated IPNI records`)

  const paths = await glob('**', {
    cwd: blocksDir,
    nodir: true,
    ignore: ['root', 'bafkqaaa']
  })

  const cids: Array<CID> = paths.map((p) => CID.parse(p.toString()))

  console.log(`🔑 Using PeerID: ${peerId}`)

  console.log(`🚀 Creating advertisement for ${cids.length} CIDs...`)

  await fs.mkdir(advertDir, { recursive: true });

  let entryChunk = new EntryChunk()
  for (const cid of cids) {
    entryChunk.add(cid.multihash.bytes)
    if (entryChunk.estimateSize() >= CHUNK_THRESHOLD) {
      const block = await entryChunk.export()
      await writeBlock(block)
      entryChunk = new EntryChunk(block.cid)
    }
  }

  const entryBlock = await entryChunk.export()
  await writeBlock(entryBlock)

  const addresses = [
    `/dns4/${webHost}/tcp/443/https`,
    `/dns6/${webHost}/tcp/443/https`
  ]

  const provider = new Provider({
    privateKey: privKey,
    addresses,
    protocol: Protocol.TrustlessGateway,
  })

  const signedAdBlock = await new Advertisement({
    peerId: peerId.toString(),
    entryCid: entryBlock.cid,
    provider,
    context: IPFS_CONTEXT
  }).export()

  await writeBlock(signedAdBlock)

  const adCid = signedAdBlock.cid.toString()

  const signedHeadBlock = await new AdvertisementHead({
    headCid: signedAdBlock.cid,
    privateKey: privKey
  }).export()

  await fs.writeFile(path.join(advertDir, 'head'), signedHeadBlock.bytes)

  await fs.writeFile(path.join(advertDir, '_ad'), adCid)

  await fs.writeFile(path.join(advertDir, '_id'), peerId.toString())

  console.log(`\n✅ Done!`);
  console.log(`🌐 Advertisement CID: ${adCid}`);
  console.log(`🌐 IPNS name: /ipns/${privKey.publicKey.toCID().toV1().toString(base36)}`);
}

export const writeBlock = async (block: BlockView) => {
  let { cid, bytes } = block
  await fs.writeFile(path.join(advertDir, cid.toString()), bytes)
}

generate().catch(console.error)
