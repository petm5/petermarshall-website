import fs from 'fs/promises'
import path from 'node:path'
import { glob } from 'glob'
import { CID } from 'multiformats'
import * as Block from 'multiformats/block'
import { sha256 } from 'multiformats/hashes/sha2'

import type { BlockView } from 'multiformats/block/interface'
import * as dagCbor from '@ipld/dag-cbor'
import { privateKeyFromRaw, generateKeyPair } from '@libp2p/crypto/keys'
import type { PrivateKey } from '@libp2p/interface'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'

import { RecordEnvelope } from '@libp2p/peer-record'

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
const TRUSTLESS_GATEWAY_PREFIX = new Uint8Array(varint.encode(0x0920))

// https://github.com/ipni/go-libipni/blob/afe2d8ea45b86c2a22f756ee521741c8f99675e5/ingest/schema/envelope.go#L20-L22
const AD_SIG_CODEC = new TextEncoder().encode('/indexer/ingest/adSignature')

enum EntryProtocol {
  TrustlessGateway,
  IPNS
}

interface Provider {
  peerId: string,
  privateKey: PrivateKey,
  addresses: Array<string>
}

class Advertisement {
  constructor(
    public entryCid: CID,
    public protocol: EntryProtocol,
    public provider: Provider,
    public context: Uint8Array
  ) {}
  getProtocolBytes(): Uint8Array {
    switch (this.protocol) {
      case EntryProtocol.TrustlessGateway:
        return TRUSTLESS_GATEWAY_PREFIX
      case EntryProtocol.IPNS:
        return IPNS_PREFIX
      default:
        throw new Error('Invalid IPNI Entry protocol specified')
    }
  }
  async encodeAndSign() {
    const metadata = this.getProtocolBytes()

    // Ugly data payload serialization - https://github.com/ipni/go-libipni/blob/afe2d8ea45b86c2a22f756ee521741c8f99675e5/ingest/schema/envelope.go#L84
    const serializedAd = new Uint8Array([
      ...this.entryCid.bytes,
      ...new TextEncoder().encode(this.provider.peerId),
      ...new TextEncoder().encode(this.provider.addresses.map(a => a.toString()).join('')),
      ...metadata,
      0 // IsRm field is always false
    ])
    const serializedAdDigest = (await sha256.digest(serializedAd)).bytes

    const record = {
      codec: AD_SIG_CODEC,
      domain: 'indexer',
      marshal: () => serializedAdDigest,
      equals: () => false
    }

    const signature = (await RecordEnvelope.seal(record, this.provider.privateKey)).marshal().subarray()

    // IPNI Advertisement - https://github.com/ipni/specs/blob/main/IPNI.md#advertisements
    return {
      Provider: this.provider.peerId,
      Addresses: this.provider.addresses,
      Entries: this.entryCid,
      ContextID: this.context,
      Metadata: metadata,
      IsRm: false,
      Signature: signature
    }
  }
  async export() {
    const signedAd = await this.encodeAndSign()
    return await Block.encode({ value: signedAd, codec: dagCbor, hasher: sha256 })
  }
}

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

  const addresses = [
    `/dns4/${webHost}/tcp/443/https`,
    `/dns6/${webHost}/tcp/443/https`
  ]

  const signedAdBlock = await new Advertisement(
    entryBlock.cid,
    EntryProtocol.TrustlessGateway,
    { peerId: peerId.toString(), privateKey: privKey, addresses },
    context
  ).export()

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
