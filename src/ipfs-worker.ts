// Cloudflare's runtime does not implement WS backpressure
Object.defineProperty(WebSocket.prototype, 'bufferedAmount', {
  get() {
    return 0;
  },
  configurable: true,
  enumerable: true,
});

import { DurableObject } from "cloudflare:workers"

// It does not implement BroadcastChannel either
import 'broadcastchannel-polyfill'

import { sendIpniAnnouncement, type IpniAnnouncement } from '../src/lib/ipfs/ipni-announcement-sender'
import { IpfsProvider } from '../src/lib/ipfs/amino-provider'
import { CID } from 'multiformats/cid'
import type { PeerId } from "@libp2p/interface";
import { privateKeyFromProtobuf } from '@libp2p/crypto/keys'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'

import site from './lib/site.json' with { type: 'json' }

declare const IPNI_ANNOUNCEMENT: string
declare const INDEXER_HOST: string
declare const ROOT_CID: string
declare const IPFS_PRIVATE_KEY: string

const ipniAnnouncement = IPNI_ANNOUNCEMENT as unknown as IpniAnnouncement
const indexerHost = new URL(INDEXER_HOST)
const rootCid = CID.parse(ROOT_CID)

const webHost = new URL(site.baseUrl)

export interface Env {
  DHT_PUBLISHER: DurableObjectNamespace<DhtPublisher>
  IPFS_PRIVATE_KEY: string
}

export class DhtPublisher extends DurableObject {
  private cachedPeers: string[]
  private peerId: PeerId

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    const b64Key = IPFS_PRIVATE_KEY
    if (!b64Key) throw new Error('IPFS_PRIVATE_KEY is missing from environment')

    const privKey = privateKeyFromProtobuf(Uint8Array.fromBase64(b64Key))

    this.peerId = peerIdFromPrivateKey(privKey)
  }

  async publish(): Promise<void> {
    if (!this.cachedPeers) {
      this.cachedPeers = (await this.ctx.storage.get<string[]>('cached_peers')) || []
    }

    const activePeers = await IpfsProvider.provide({
      cids: [rootCid],
      webHost,
      peerId: this.peerId,
      peers: this.cachedPeers,
    })

    await this.ctx.storage.put('cached_peers', activePeers)
  }
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ) {
    console.log('Running scheduled IPNI refresh\n')
    ctx.waitUntil(sendIpniAnnouncement(ipniAnnouncement, indexerHost))

    const id = env.DHT_PUBLISHER.idFromName('global-dht-publisher')
    const stub = env.DHT_PUBLISHER.get(id)

    console.log('Running scheduled DHT reprovide')
    ctx.waitUntil(stub.publish())
  },
}
