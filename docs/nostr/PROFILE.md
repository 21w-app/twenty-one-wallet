# 21W Nostr profile convention

Open convention for linking a static Ark receive address to a Nostr identity. Any wallet or client may read or write the same field.

**Status:** Adopted as the 21W Nostr discoverability convention.

## Field

Publish the wallet’s static Ark address in **Nostr kind `0` profile metadata**:

```json
{
  "name": "Alice",
  "about": "…",
  "21w_ark": "ark1…"
}
```

| Property   | Value                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Key**    | `21w_ark`                                                                                                                           |
| **Value**  | Static Ark receive address from the user’s wallet (`walletMode: 'static'`, seed-derived)                                            |
| **Event**  | Kind `0`, replaceable per [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) (latest profile event per pubkey wins) |
| **Signer** | The user’s Nostr identity (`social_npub`)                                                                                           |

The Ark address itself is also portable across Ark wallets via the same mnemonic; this field only makes it **discoverable** through Nostr.

## Resolving a contact’s Ark address

Any client (21W or otherwise) with read access to relays:

1. Load the payer’s contact list: kind `3`, `author = <payer_npub>`.
2. For each followed pubkey, fetch kind `0`.
3. Read `content.21w_ark` (parse JSON if string).
4. If present and valid, the contact is payable via Ark→Ark.

No 21W backend is required for this flow.

## Publishing (discoverable receive)

Only the holder of the Nostr private key for `social_npub` can set `21w_ark` on that profile.

**Recommended (21W default):** one-time in-app signing — import `nsec` in a session-only wizard, merge `21w_ark` into existing kind `0` content, publish to relays, discard `nsec` immediately. Never store or transmit `nsec` to 21W servers.

**Advanced:** user publishes kind `0` themselves; see `BE-DISCOVERABLE.md`.

## Security

- Do **not** trust a wallet-only claim of someone else’s `npub` without a kind `0` event signed by that `npub`.
- `21w_ark` on kind `0` is public — same deanonymization tradeoff as any public receive directory.
- Send-to-contacts only needs the payer’s **`npub`** (read-only relay queries).

## Default relays

21W should publish and query a configurable default relay set (listed in app config when implemented). Clients should not rely on a single relay.

## Versioning

| `21w_ark` spec version | Notes                     |
| ---------------------- | ------------------------- |
| `v1`                   | Initial field on kind `0` |

Future optional fields (e.g. `21w_wallet_npub` for NIP-06 wallet identity) may be documented separately if needed for advanced users.
