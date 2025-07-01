# ouch-client
client for ouch bist




### Notes

- Has issues on Fedora Linux above electron@36.0.0 do not update until resolved


Roadmap

- Current Feature WIP => Connection Handling

make the client side backend wait for a connection req from the frontend 
let the frontend handle other parameters as well


TODO

make a synced queue where orders get deleted only when the ACK has arrived could make it persistent over time idk.




Obviously the current prefill data etc are held in memory. On more established use cases a local db would be much more preferable. 