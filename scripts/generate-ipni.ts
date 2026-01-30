import fs from 'fs/promises'
import path from 'node:path'
import { glob } from 'glob'
import { CID } from 'multiformats'
import * as Block from 'multiformats/block'
import { sha256 } from 'multiformats/hashes/sha2'
import { base36 } from 'multiformats/bases/base36'

import type { BlockView } from 'multiformats/block/interface'
import * as dagCbor from '@ipld/dag-cbor'
import { privateKeyFromRaw, generateKeyPair } from '@libp2p/crypto/keys'
import type { PrivateKey } from '@libp2p/interface'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'

import { RecordEnvelope } from '@libp2p/peer-record'

import { createIPNSRecord, marshalIPNSRecord } from 'ipns'

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

// Entries are Trustless Gateway providers
// https://github.com/ipni/specs/blob/main/IPNI.md#metadata
// https://github.com/multiformats/go-multicodec/blob/f57c73871939a0d533597e1dae416dae92533fb6/code_table.go#L459-L460
const TRUSTLESS_GATEWAY_PREFIX = new Uint8Array(varint.encode(0x0920))

// Entries are IPNS records
// https://github.com/multiformats/go-multicodec/blob/f57c73871939a0d533597e1dae416dae92533fb6/code_table.go#L435-L436
const IPNS_RECORD_PREFIX = new Uint8Array(varint.encode(0x0300))

// https://github.com/ipni/go-libipni/blob/afe2d8ea45b86c2a22f756ee521741c8f99675e5/ingest/schema/envelope.go#L20-L22
const AD_SIG_CODEC = new TextEncoder().encode('/indexer/ingest/adSignature')

const IPFS_CONTEXT = new TextEncoder().encode('/ipfs')
const IPNS_CONTEXT = new TextEncoder().encode('/ipni/naam')

interface Provider {
  peerId: string,
  privateKey: PrivateKey,
  addresses: Array<string>
}

class Advertisement {
  constructor(
    public entryCid: CID,
    public metadata: Uint8Array,
    public provider: Provider,
    public context: Uint8Array,
    public prevCid?: CID
  ) {}
  async encodeAndSign() {
    // Ugly data payload serialization - https://github.com/ipni/go-libipni/blob/afe2d8ea45b86c2a22f756ee521741c8f99675e5/ingest/schema/envelope.go#L84
    const serializedAd = new Uint8Array([
      ...this.prevCid?.bytes ?? new Uint8Array([]),
      ...this.entryCid.bytes,
      ...new TextEncoder().encode(this.provider.peerId),
      ...new TextEncoder().encode(this.provider.addresses.map(a => a.toString()).join('')),
      ...this.metadata,
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
      ...(this.prevCid ? { PreviousID: this.prevCid } : {}),
      Provider: this.provider.peerId,
      Addresses: this.provider.addresses,
      Entries: this.entryCid,
      ContextID: this.context,
      Metadata: this.metadata,
      IsRm: false,
      Signature: signature
    }
  }
  async export(): Promise<BlockView> {
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

  const provider = { peerId: peerId.toString(), privateKey: privKey, addresses }

  const signedAdBlock = await new Advertisement(
    entryBlock.cid,
    TRUSTLESS_GATEWAY_PREFIX,
    provider,
    IPFS_CONTEXT
  ).export()

  await writeBlock(signedAdBlock)

  console.log(`🚀 Creating advertisement for IPNS record...`)

  const ipnsValue = CID.parse((await fs.readFile(path.join(blocksDir, 'root'))).toString())
  const ipnsLifetime = 60 * 60 * 1000 // 1 hour

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

  // Concatenate the IPNS record specifier with the record data
  // https://github.com/ipni/specs/blob/main/IPNI.md#metadata
  // https://github.com/ipni/go-naam/blob/7319ed2cbb9d46eb560e6423ccd9d9a97874f826/naam.go#L425-L434
  const ipnsMetadata = new Uint8Array([
    ...IPNS_RECORD_PREFIX,
    ...varint.encode(marshalledRecord.length),
    ...marshalledRecord
  ])

  const signedIpnsAdBlock = await new Advertisement(
    ipnsEntryBlock.cid,
    ipnsMetadata,
    provider,
    IPNS_CONTEXT,
    signedAdBlock.cid
  ).export()

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
