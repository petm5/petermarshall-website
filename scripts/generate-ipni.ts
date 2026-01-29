import fs from 'fs/promises'
import path from 'node:path'
import { glob } from 'glob'
import { CID } from 'multiformats/cid'
import * as Block from 'multiformats/block'
import { sha256 } from 'multiformats/hashes/sha2'

import type { BlockView } from 'multiformats/block/interface'
import * as dagCbor from '@ipld/dag-cbor'
import { privateKeyFromRaw, generateKeyPair } from '@libp2p/crypto/keys'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'

import varint from 'varint'

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

const CID_SIZE_BYTES = 36;

class EntryChunk {
  next?: CID
  entries: Array<Uint8Array> = []
  constructor(next?: CID) {
    this.next = next
  }
  add(entry: Uint8Array) {
    this.entries.push(entry)
  }
  estimateSize() {
    // assume 1K overhead just to be safe
    return this.entries.length * CID_SIZE_BYTES + 1024
  }
  async export() {
    // IPNI EntryChunk - https://github.com/ipni/specs/blob/main/IPNI.md#entrychunk-chain
    const value = {
      Entries: this.entries,
      ...(this.next ? { Next: this.next } : {})
    }
    return await Block.encode({ value, codec: dagCbor, hasher: sha256 })
  }
}

// libp2p doesn't like blocks over 1MB
const CHUNK_THRESHOLD = 1_048_576

// Signals that the provider is a Trustless Gateway
// https://github.com/ipni/specs/blob/main/IPNI.md#metadata
const HTTP_PREFIX = new Uint8Array(varint.encode(0x0920))

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

  // Arbitrary handle, we don't expect to use it again
  const context = new Uint8Array([0x98])

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

  // IPNI Advertisement - https://github.com/ipni/specs/blob/main/IPNI.md#advertisements
  const advertisement = {
    Provider: peerId,
    Addresses: [
      `/dns4/${webHost}/tcp/443/https`,
      `/dns6/${webHost}/tcp/443/https`
    ],
    Entries: {
      '/': entryBlock.cid
    },
    ContextID: context,
    Metadata: HTTP_PREFIX,
    IsRm: false
  }

  const adBytes = dagCbor.encode(advertisement)

  const signature = await privKey.sign(adBytes)

  const signedAd = {
    Payload: adBytes,
    Signature: new Uint8Array(signature),
    PublicKey: privKey.publicKey
  }

  const signedAdBlock = await Block.encode({ value: signedAd, codec: dagCbor, hasher: sha256 })
  const headCid = signedAdBlock.cid.toString()

  await writeBlock(signedAdBlock)

  await fs.writeFile(path.join(advertDir, 'head'), headCid)

  await fs.writeFile(path.join(advertDir, 'id'), peerId.toString())

  console.log(`\n✅ Done!`);
  console.log(`🌐 Advertisement CID: ${headCid}`);
}

export const writeBlock = async (block: BlockView) => {
  let { cid, bytes } = block
  await fs.writeFile(path.join(advertDir, cid.toString()), bytes)
}

generate().catch(console.error)
