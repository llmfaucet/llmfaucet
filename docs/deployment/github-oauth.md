# GitHub OAuth

Production and preview use separate OAuth apps and callback URLs. Request only
`read:user`; keep client secrets in Worker secrets and discard access tokens
after profile/sponsor synchronization.
