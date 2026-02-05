import fs from 'fs/promises'
import path from 'node:path'
import { glob } from 'glob'
import { CID } from 'multiformats'
import { base36 } from 'multiformats/bases/base36'

import type { BlockView } from 'multiformats/block/interface'
import { privateKeyFromRaw, generateKeyPair } from '@libp2p/crypto/keys'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'

import { createIPNSRecord, marshalIPNSRecord } from 'ipns'

import { Advertisement, EntryChunk, Provider, Protocol, CHUNK_THRESHOLD } from 'js-ipni'

import site from '../src/lib/site.json' with { type: 'json' }

const webHost = new URL(site.baseUrl).host

const distDir = path.resolve('build')
const blocksDir = path.join(distDir, 'ipfs')
const advertDir = path.join(distDir, 'ipni', 'v1', 'ad')

const loadKey = async () => {
  const b64Key = process.env.IPFS_PRIVATE_KEY

  if (b64Key) {
    return privateKeyFromRaw(Buffer.from(b64Key, 'base64'))
  } else {
    console.warn('⚠️ WARNING: Using random keypair. This is probably not what you want.')
    return await generateKeyPair('Ed25519')
  }
}

const privKey = await loadKey()

const peerId = peerIdFromPrivateKey(privKey)

const IPFS_CONTEXT = new TextEncoder().encode('/ipfs')
const IPNS_CONTEXT = new TextEncoder().encode('/ipni/naam')

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

  console.log(`🚀 Creating advertisement for IPNS record...`)

  const ipnsValue = CID.parse((await fs.readFile(path.join(blocksDir, 'root'))).toString())
  const ipnsLifetime = 10 * 365 * 24 * 60 * 60 * 1000 // 10 years

  console.log(`🔗 IPNS record will be valid for ${Math.floor(ipnsLifetime / 1000)} seconds.`)

  // Use the current time as a stateless counter
  const ipnsSequence = Date.now()

  const ipnsRecord = await createIPNSRecord(privKey, ipnsValue, ipnsSequence, ipnsLifetime)

  // Returns raw protobuf with no length prefix
  const marshalledRecord = marshalIPNSRecord(ipnsRecord)

  const ipnsEntryChunk = new EntryChunk()
  ipnsEntryChunk.add(privKey.publicKey.toMultihash().bytes)

  const ipnsEntryBlock = await ipnsEntryChunk.export()
  await writeBlock(ipnsEntryBlock)

  const ipnsProvider = new Provider({
    privateKey: privKey,
    addresses,
    protocol: Protocol.IpnsRecord,
    metadata: marshalledRecord,
  })

  const signedIpnsAdBlock = await new Advertisement({
    peerId: peerId.toString(),
    entryCid: ipnsEntryBlock.cid,
    provider: ipnsProvider,
    context: IPNS_CONTEXT,
    prevCid: signedAdBlock.cid
  }).export()

  const headCid = signedIpnsAdBlock.cid.toString()
  await writeBlock(signedIpnsAdBlock)

  await fs.writeFile(path.join(advertDir, 'head'), headCid)

  await fs.writeFile(path.join(advertDir, 'id'), peerId.toString())

  await fs.writeFile(path.join(advertDir, 'ipns'), marshalledRecord)

  console.log(`\n✅ Done!`);
  console.log(`🌐 Advertisement CID: ${headCid}`);
  console.log(`🌐 IPNS name: /ipns/${privKey.publicKey.toCID().toV1().toString(base36)}`);
}

export const writeBlock = async (block: BlockView) => {
  let { cid, bytes } = block
  await fs.writeFile(path.join(advertDir, cid.toString()), bytes)
}

generate().catch(console.error)
