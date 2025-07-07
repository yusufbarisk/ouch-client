# 🚀 ouch-client

<p align="center">
  <img src="./assets/demo.gif" alt="OUCH Client Demo" width="90%"/>
</p>

A modern, professional OUCH 3.0.0 protocol client for BIST, built for traders, testers, and protocol enthusiasts. 

---

### 📝 Description

OUCH Client is a cross-platform client for the OUCH 3.0.0 (BIST) protocol, designed for BIST and similar trading venues. It features a UI, persistent connection profiles, real-time backend, and a built-in Python test server. Perfect for algo devs, testers, and anyone who wants to play with OUCH ig.

---

### Notes

-  **Has issues on Fedora Linux above electron@36.0.0** — _do not update until resolved_
- All prefill/order/connection data is currently held in memory or localStorage. On more established use cases, a local db would be much more preferable.

---

### Roadmap

- [x] ~~make the client side backend wait for a connection req from the frontend~~
- [x] ~~let the frontend handle other parameters as well~~
- [ ] make a synced queue where orders get deleted only when the ACK has arrived (could make it persistent over time, idk)

---

### 📅 TODO

- [ ] 🗃️ make a synced queue where orders get deleted only when the ACK has arrived (could make it persistent over time, idk) (turned to pubsub bidirectional but could change back)
- [ ] 📈 More advanced analytics and reporting
- [ ] 👥 Multi-profile & multi-session support
- [ ] 🎨 UI polish & more themes (Actual working themes)
- [ ] 💼 Export/import profiles and replay scenarios

---

### ✨ Features

- 🎛️ **Connection Profiles**: Save, select, and persist connection configs across restarts!
- 🔒 **Secure Authentication**: Username & password fields, profile-based storage.
- 🖥️ **Beautiful UI**: Modern, responsive, and dark-themed interface.
- 📡 **Real-time Backend Connection**: Electron + Python backend with ZeroMQ for fast event streaming.
- 🧠 **Order Management**: Place, cancel, and replace orders with detailed status and prefill support.
- 📊 **Statistics & Analytics**: Live order stats, fills, rejections, and more.
- 🧩 **Modular Components**: Easy to extend and hack for your own needs.
- 📝 **FIX/OUCH Message Inspection**: View, filter, and copy protocol messages and tags.
- 🛠️ **Test Server**: Built-in Python test server for local development.
- 💾 **Persistent Variables**: Save custom variables for quick order entry.
- 🧪 **Robust Heartbeat & Session Handling**: Never miss a beat!

---

### 🚀 Quick Start

1. `npm install` in `/front` and `/backend` (Python deps)
2. `npm run front` for the UI
3. `python backend/main.py` for the backend
4. Connect, trade, and test! 🥳

### `.env`

```dotenv
HOST_ADDR="127.0.0.1"
HOST_PORT=9999
HEARTBEAT_INTERVAL=5
DEBUG=True

TEST_USERNAME="admin"
TEST_PASSWORD="admin"

---

### 💬 Contributing

PRs, issues, and feature requests are welcome! Open an issue or ping me on GitHub. Let's make OUCH trading fun and hackable! 🚀

---

Made with ☕, 🧠, and a lot of 💥 by ybkose