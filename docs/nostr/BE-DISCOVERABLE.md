# Be discoverable without pasting your Nostr private key into 21W

Optional path for users who want Nostr contacts to pay them but prefer **not** to enter `nsec` in 21W.

## What you need

1. Your **static Ark address** from 21W Receive screen.
2. Your Nostr **`npub`**.
3. A Nostr client or tool that can publish **kind `0` profile** events.

## Steps

1. Fetch your current kind `0` profile from relays (if any) so you do not wipe `name`, `picture`, etc.
2. Add or update the field in the JSON content:

   ```json
   {
     "21w_ark": "ark1…"
   }
   ```

3. Publish a **replaceable** kind `0` event signed by your identity.
4. Publish to the same relays 21W uses (see app settings when implemented).
5. In 21W Settings → **Be discoverable** → choose **I published it myself**, enter your `npub`, tap **Verify on relays**.

21W checks that `content.21w_ark` on relays matches your wallet’s static Ark address.

## Limitations

Most Nostr apps do **not** expose arbitrary JSON fields in the profile UI. You may need:

- A client with raw/advanced profile editing, or
- CLI tools (`nak`, etc.), or
- A web profile editor that supports custom kind `0` content.

For most users, the in-app **one-time sign** path in 21W is simpler.

## After restore

Static Ark address is unchanged when you restore the same mnemonic. If `21w_ark` is already on your kind `0` on relays, you do **not** need to publish again — only re-verify in 21W.
