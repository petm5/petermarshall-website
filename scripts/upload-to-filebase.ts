import { open, readFile, writeFile, glob } from 'node:fs/promises'
import path from 'path'
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { BaseBlockstore } from 'blockstore-core'
import type { Pair } from 'interface-blockstore'
import { CID } from 'multiformats/cid'
import { CarWriter } from '@ipld/car'
import { Readable } from 'node:stream'
import type { AbortOptions } from 'abort-error'

async function* readFileChunks(filePath: string) {
  const stream = (await open(filePath)).createReadStream()

  for await (const chunk of stream) {
    yield new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
  }
}

function getEnv(key: string): string {
  const val = process.env[key]
  if (val == null) {
    throw new Error(`Required variable '${key}' is unset!`)
  }
  return val
}

class DirectoryBlockstore extends BaseBlockstore {
  readonly path
  constructor(path: string) {
    super()
    this.path = path
  }
  private blockPath(key: CID) {
    return path.join(this.path, key.toString())
  }
  async * get(key: CID) {
    return (await open(this.blockPath(key))).createReadStream()
  }
  async put(key: CID, val: Uint8Array) {
    await writeFile(this.blockPath(key), val)
    return key
  }
  async * getAll(options?: AbortOptions): AsyncGenerator<Pair> {
    for await (const file of glob(path.join(this.path, '*'), {
      exclude: [
        '**/root',
        '**/bafkqaaa',
        '**/head',
        '**/_ad',
        '**/_id',
      ]
    })) {
      if (options?.signal?.aborted) break
      const data = readFileChunks(file)
      const block: Pair = {
        cid: CID.parse(path.basename(file)),
        bytes: data
      }
      yield block
    }
  }
}

const s3 = new S3Client({
  endpoint: 'https://s3.filebase.io',
  region: 'auto',
  credentials: {
    accessKeyId: getEnv('FILEBASE_KEY'),
    secretAccessKey: getEnv('FILEBASE_SECRET'),
  },
})

const distDir = path.resolve('build')
const blocksDir = path.join(distDir, 'ipfs');

async function streamCar(root: CID, store: BaseBlockstore) {
  const { writer, out } = CarWriter.create(root)

  void (async () => {
    for await (const block of store.getAll()) {
      for await (const chunk of block.bytes) {
        await writer.put({ cid: block.cid, bytes: chunk })
      }
    }

    await writer.close()
  })()

  return out
}

interface UploadOptions {
  bucket: string,
  key: string,
}

async function main({ bucket, key }: UploadOptions) {
  const blockstore = new DirectoryBlockstore(blocksDir)

  const rootCidString = await readFile(path.join(blocksDir, 'root'), { encoding: 'utf8' })
  if (!rootCidString) {
    throw new Error("Failed to read root CID file")
  }

  const rootCid: CID = CID.parse(rootCidString)

  console.log(`🌐 Root CID: ${rootCid.toString()}`)

  const carStream = streamCar(rootCid, blockstore)

  console.log(`📡 Starting upload to s3://${bucket}/${key}`)

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: Readable.from(await carStream),
      ContentType: 'application/vnd.ipld.car',
      Metadata: {
        import: 'car',
      },
    },
  });

  await upload.done()
}

(async () => {
  const options = {
    bucket: getEnv('FILEBASE_BUCKET'),
    key: getEnv('FILEBASE_FILENAME'),
  }

  await main(options)
    .then(() => console.log('\n✅ Done!'))
    .catch(console.error)
})()
