Gatho Matrix Bot
================

A Matrix bot which synchronises RSVP reactions to and announcements from Gatho - a simple event
hosting tool hosted at [https://gatho.party](https://gatho.party).

Contributions are very welcome. I encourage other event planning apps to adopt this bot (or a fork
or alternative) to integrate with Matrix - an open, well funded, well supported
communication protocol with [dozens](https://matrix.org/clients/) of compatible clients.

# Current features
- When added to a room, the bot prompts to link or create a Gatho event
- Allows users to RSVP to an event by adding a thumbs up/thumbs down/thinking emoji

# Local development setup
## Setup `matrix-bot-sdk` fork
The original doesn't emit reaction or redaction events which are required for figuring out when
to send an RSVP message to Gatho. A [PR has been raised](https://github.com/turt2live/matrix-bot-sdk/pull/182).

- Clone https://github.com/jakecoppinger/matrix-bot-sdk/tree/emit-more-events somewhere
  (`git clone git@github.com:jakecoppinger/matrix-bot-sdk.git`)
- Run `yarn`
- Run `yarn build`
- Run `yarn link` 

## Setting up Gatho Matrix Bot
- `yarn`
- `yarn link "matrix-bot-sdk"`
- `yarn build`
- `yarn start`

# License
GNU GPLv3. See LICENSE