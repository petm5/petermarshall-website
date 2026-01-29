import fs from 'fs/promises'
import path from 'node:path'
import { glob } from 'glob'
import { CID } from 'multiformats/cid'
import * as Block from 'multiformats/block'
import { sha256 } from 'multiformats/hashes/sha2'

import type { BlockView } from 'multiformats/block/interface'
import * as dagJson from '@ipld/dag-json'
import { privateKeyFromRaw, generateKeyPair, privateKeyToProtobuf, publicKeyToProtobuf } from '@libp2p/crypto/keys'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'

import { Provider, Advertisement } from '@web3-storage/ipni'
import { EntryChunk, RECOMMENDED_MAX_BLOCK_BYTES } from '@web3-storage/ipni/entry-chunk.js'

import site from '../src/lib/site.json' with { type: 'json' }

const webHost = new URL(site.baseUrl).host

const distDir = path.resolve('build')
const blocksDir = path.join(distDir, 'ipfs')
const advertDir = path.join(distDir, 'ipni', 'v1', 'ad')

const loadKey = async () => {
  const b64Key = process.env.IPFS_PRIVATE_KEY

  let key;
  if (b64Key) {
    return await privateKeyFromRaw(Buffer.from(b64Key, 'base64'))
  } else {
    console.warn('⚠️ WARNING: Using random keypair. This is probably not what you want.')
    return await generateKeyPair('Ed25519')
  }
}

const privKey = await loadKey()

const peerId = {
  id: peerIdFromPrivateKey(privKey),
  privateKey: privateKeyToProtobuf(privKey),
  publicKey: publicKeyToProtobuf(privKey.publicKey)
}

export const generate = async () => {
  console.log(`🌌 Generating updated IPNI records`)

  const paths = await glob('**', {
    cwd: blocksDir,
    nodir: true,
    ignore: ['root', 'bafkqaaa']
  })

  const cids: Array<CID> = paths.map((p) => CID.parse(p.toString()))

  console.log(`🔑 Using PeerID: ${privKey.publicKey.toString()}`)

  console.log(`🚀 Creating advertisement for ${cids.length} CIDs...`)

  const context = new Uint8Array([99])
  const previous = null

  const http4 = new Provider({
    protocol: 'http',
    addresses: `/dns4/${webHost}/tcp/443/https`,
    peerId
  })

  const http6 = new Provider({
    protocol: 'http',
    addresses: `/dns6/${webHost}/tcp/443/https`,
    peerId
  })

  await fs.mkdir(advertDir, { recursive: true });

  let entryChunk = new EntryChunk()
  for (const cid of cids) {
    entryChunk.add(cid.multihash.bytes)
    if (entryChunk.calculateEncodedSize() >= RECOMMENDED_MAX_BLOCK_BYTES) {
      const block = await entryChunk.export()
      await writeBlock(block)
      entryChunk = new EntryChunk({ next: block.cid })
    }
  }

  const entryBlock = await entryChunk.export()
  await writeBlock(entryBlock)

  const advert = new Advertisement({
    providers: [http4, http6],
    entries: entryBlock.cid,
    context,
    previous
  })

  const value = await advert.encodeAndSign()

  const block = await Block.encode({ value, codec: dagJson, hasher: sha256 })
  const rootCid = block.cid.toString()

  await writeBlock(block)

  await fs.writeFile(path.join(advertDir, 'head'), rootCid)

  await fs.writeFile(path.join(advertDir, 'id'), privKey.publicKey.toString())

  console.log(`\n✅ Done!`);
  console.log(`🌐 Advertisement CID: ${rootCid}`);
}

export const writeBlock = async (block: BlockView) => {
  let { cid, bytes } = block
  await fs.writeFile(path.join(advertDir, block.cid.toString()), block.bytes)
}

generate().catch(console.error)
