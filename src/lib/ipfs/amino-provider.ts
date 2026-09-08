import { kadDHT, removePrivateAddressesMapper } from '@libp2p/kad-dht'
import { bootstrap } from '@libp2p/bootstrap'
import { createLibp2p } from 'libp2p'
import { ping } from '@libp2p/ping'
import { identify } from '@libp2p/identify'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { CID } from 'multiformats/cid'
import type { PeerId } from '@libp2p/interface'

const defaultBootstrapList = [
  '/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
  '/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
]

export interface IpfsProviderOpts {
  cids: CID[],
  addresses: string[],
  peerId: PeerId,
  peers?: string[],
}

export class IpfsProvider {
  static async provide(opts: IpfsProviderOpts) {
    const bootstrapList = [
      ...defaultBootstrapList,
      ...opts.peers ?? []
    ]

    const node = await createLibp2p({
      services: {
        aminoDHT: kadDHT({
          clientMode: true,
          querySelfInterval: 0,
          kBucketSize: 5,
          protocol: '/ipfs/kad/1.0.0',
          peerInfoMapper: removePrivateAddressesMapper
        }),
        ping: ping(),
        identify: identify()
      },
      addresses: {
        announce: opts.addresses
      },
      connectionManager: {
        maxConnections: 5
      },
      peerDiscovery: [
        bootstrap({
          list: bootstrapList
        })
      ],
      connectionEncrypters: [
        noise(),
      ],
      transports: [
        webSockets(),
      ],
      streamMuxers: [
        yamux(),
      ],
    })

    // node.addEventListener('peer:discovery', (evt) => {
    //   console.log('found peer: ', evt.detail.id)
    // })

    let activePeers = []

    try {
      for (const cid of opts.cids) {
        await node.contentRouting.provide(cid)
      }

      activePeers = node.getConnections().map((p) => p.remoteAddr.toString()).slice(0,8)
    } catch (err) {
      throw err
    } finally {
      // Wait for peers to verify our submission
      await new Promise(res => setTimeout(res, 10 * 1000))
      await node.stop()
    }

    return activePeers
  }
}
