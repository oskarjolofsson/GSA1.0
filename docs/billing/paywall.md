# What's Behind the Paywall

A plain-language map of which features require a paid subscription (or active free
trial) and which are free for any signed-in user. Use this to decide what to put
behind the paywall and what to leave open.

> This is the product view, not the technical one. Payment provider is
> intentionally not discussed here — it works the same regardless of how billing
> is handled.

---

## Who can access premium

Access is granted to a user if **either** is true:

- They have an **active paid subscription**, or
- They are still inside their **free trial** window.

Everyone else (trial expired, never subscribed) is treated as a free user and is
prompted to upgrade when they reach a premium feature.

---

## Premium features (require subscription or active trial)

These are blocked for free users — reaching them shows the "upgrade" prompt:

- **Uploading a swing** for analysis
- **Drills** — the recommended drills list
- **Drill results**

## Free features (any signed-in user)

These are open to everyone, no subscription needed:

- **Dashboard home**
- **Viewing past analyses**
- **Issues** (detected swing issues)
- **Profile & account / subscription management**
- All **public pages** (landing, pricing, legal)

---

## What the user sees

- **During the free trial:** a banner showing days remaining, with an Upgrade
  button.
- **After the trial ends (no subscription):** a banner saying the trial has ended
  with an Upgrade prompt.
- **When trying to open a premium feature without access:** an upgrade prompt
  appears and the user is sent back to the dashboard home.

The upgrade prompt is reused in three situations, with slightly different wording:
opening a premium feature, access having expired mid-use, or the user choosing to
upgrade themselves.

---

## Things to keep in mind when deciding what to gate

- **The free trial counts as full premium access.** Anything you put behind the
  paywall is still fully usable by trial users until their trial ends.
- **Account and billing management is always free** — users must be able to
  manage or cancel their subscription even after it lapses.
- **Public-facing and informational pages stay open** — landing, pricing, legal.
- **Gating is a product decision, enforced in two places working together:** the
  app blocks the screen up front, and the backend independently refuses premium
  actions. So a feature is "premium" only once it's marked premium on the
  backend too — front-end gating alone is not enough to actually protect it.

---

## Summary table

| Feature                        | Free | Premium |
| ------------------------------ | :--: | :-----: |
| Landing / pricing / legal      |  ✅  |         |
| Dashboard home                 |  ✅  |         |
| View past analyses             |  ✅  |         |
| Issues                         |  ✅  |         |
| Profile & subscription mgmt    |  ✅  |         |
| Upload a swing                 |      |   🔒    |
| Drills                         |      |   🔒    |
| Drill results                  |      |   🔒    |
</content>
