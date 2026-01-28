import { importer } from 'ipfs-unixfs-importer';
import { rabin } from 'ipfs-unixfs-importer/chunker';
import { BlackHoleBlockstore } from 'blockstore-core';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import site from '../src/lib/site.json' with { type: 'json' };

// Dummy PeerID required for routing
// TODO: Use actual keypair for IPNI publishing
const nodePeerId = 'QmWjh6bSiHZZd2pUN17yUu2XaTvMi77EzJbmmgjW2zanVp';
const nodeMultiaddr = `/dns4/${(new URL(site.baseUrl)).host}/tcp/443/https`;

class RawDirBlockstore extends BlackHoleBlockstore {
  constructor(callback) {
    super()
    this.getCallback = callback
  }
  async put(cid, data) {
    await this.getCallback(cid, data)
    return super.put(cid, data)
  }
}

const generate = async () => {
  const distDir = path.resolve('build')
  const blocksDir = path.join(distDir, 'ipfs');
  const routingDir = path.join(distDir, 'routing', 'v1', 'providers');

  const blockstore = new RawDirBlockstore(async (cid, data) => {
    const filename = cid.toString()
    await fs.writeFile(path.join(blocksDir, filename), data)

    const providerInfo = {
      Providers: [
        {
          Schema: 'peer',
          ID: nodePeerId,
          Addrs: [nodeMultiaddr]
        }
      ]
    }

    await fs.writeFile(path.join(routingDir, filename), JSON.stringify(providerInfo))
  });

  console.log('📦 Generating IPFS block store')

  await fs.mkdir(blocksDir, { recursive: true });
  await fs.mkdir(routingDir, { recursive: true });

  console.log(`🔑 Using PeerID: ${nodePeerId}`)
  console.log(`🕸️ Using multiaddr: ${nodeMultiaddr}`)

  const paths = await glob('**/*', {
    cwd: distDir,
    nodir: true,
    // Ignore our own output paths
    ignore: ['ipfs/**', 'routing/**']
  });

  const source = await Promise.all(paths.map(async (p) => ({
    // Collect everything into a virtual top-level dir
    path: path.join('content', p),
    content: (await fs.open(path.join(distDir, p))).createReadStream()
  })));

  console.log(`🚀 Processing ${source.length} files from ${blocksDir.toString()}...`);

  const options = {
    chunker: rabin({
      minChunkSize: 8192,
      avgChunkSize: 16384,
      maxChunkSize: 32768,
    }),
    rawLeaves: true
  };

  let rootCid;
  for await (const entry of importer(source, blockstore, options)) {
    rootCid = entry.cid;
    // console.log(`📁 Ingested file: ${entry.path} -> ${entry.cid}`);
  }

  await fs.writeFile(path.join(blocksDir, 'root'), rootCid.toString())

  // Empty probing CID
  await fs.writeFile(path.join(blocksDir, 'bafkqaaa'), '')

  console.log(`\n✅ Done!`);
  console.log(`🌐 Root CID: ${rootCid}`);
}

generate().catch(console.error)
