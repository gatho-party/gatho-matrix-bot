
import { RSVPCount, RSVPReaction } from '../src/interfaces';
import { sendRSVP, Status } from '../src/gatho-api';
import { emojiMap } from '../src/common-interfaces';
import { addRSVP, calculateStatusToSend } from '../src/update-rsvp-count';

describe("#addRSVP()", () => {
  test("when no other rsvps are present, add new rsvp", async () => {
    const rsvpCount: RSVPCount = {};
    const newRsvpCount = addRSVP(rsvpCount, 'our-room-id', {
      status: 'notgoing',
      sender: 'sender',
      matrixEventId: 'event_id',
      displayname: 'sender pretty name'
    });
    expect(newRsvpCount).toMatchInlineSnapshot(`
Object {
  "our-room-id": Array [
    Object {
      "displayname": "sender pretty name",
      "matrixEventId": "event_id",
      "sender": "sender",
      "status": "notgoing",
    },
  ],
}
`);
  });

  test("when other rsvp with same sender present, don't replace rsvp", async () => {
    const rsvpCount: RSVPCount = {
      'our-room-id': [
        {
        status: 'notgoing',
        sender: 'sender',
        matrixEventId: 'event_id1',
        displayname: 'sender pretty name'
      },
        {
        status: 'notgoing',
        sender: 'other_sender',
        matrixEventId: 'event_id2',
        displayname: 'some other sender pretty name'
      }
    ]

    };
    const newRsvpCount = addRSVP(rsvpCount, 'our-room-id', {
      status: 'going',
      sender: 'sender',
      matrixEventId: 'event_id',
      displayname: 'sender pretty name'
    });
    expect(newRsvpCount).toMatchInlineSnapshot(`
Object {
  "our-room-id": Array [
    Object {
      "displayname": "sender pretty name",
      "matrixEventId": "event_id1",
      "sender": "sender",
      "status": "notgoing",
    },
    Object {
      "displayname": "some other sender pretty name",
      "matrixEventId": "event_id2",
      "sender": "other_sender",
      "status": "notgoing",
    },
    Object {
      "displayname": "sender pretty name",
      "matrixEventId": "event_id",
      "sender": "sender",
      "status": "going",
    },
  ],
}
`);
  });
});

describe("#calculateStatusToSend()", () => {
  const emojiMap: { [key: string]: Status; } = {
    "up": 'going',
    "down": 'notgoing',
    "thinking": 'maybe'
  }

  test("when no other rsvps are present, status is invited", async () => {
    const rsvpsInRoom: RSVPReaction[] = [
      {
        status: "going",
        sender: 'alice',
        matrixEventId: 'event1'
      }
    ];

    const result: Status | null = calculateStatusToSend(rsvpsInRoom, 'event1');
    expect(result).toBe('invited');
  });

  test("when going rsvps also present, status is going", async () => {
    const rsvpsInRoom: RSVPReaction[] = [
      {
        status: "going",
        sender: 'alice',
        matrixEventId: 'event1'
      },
      {
        status: "notgoing",
        sender: 'alice',
        matrixEventId: 'event2'
      }
    ];

    const result: Status | null = calculateStatusToSend(rsvpsInRoom, 'event2');
    expect(result).toBe('going');
  });
  test("when removing going, and notgoing rsvps also present, status is notgoing", async () => {
    const rsvpsInRoom: RSVPReaction[] = [
      {
        status: "notgoing",
        sender: 'alice',
        matrixEventId: 'event1'
      },
      {
        status: "going",
        sender: 'alice',
        matrixEventId: 'event2'
      }
    ];

    const result: Status | null = calculateStatusToSend(rsvpsInRoom, 'event2');
    expect(result).toBe('notgoing');
  });

  test("when going and maybe rsvps also present, don't send any status", async () => {
    const rsvpsInRoom: RSVPReaction[] = [
      {
        status: "maybe",
        sender: 'alice',
        matrixEventId: 'event1'
      },
      {
        status: "going",
        sender: 'alice',
        matrixEventId: 'event2'
      },
      {
        status: "notgoing",
        sender: 'alice',
        matrixEventId: 'event3'
      }
    ];

    const result: Status | null = calculateStatusToSend(rsvpsInRoom, 'event2');
    expect(result).toBe(null);
  });
  test("when one valid rsvp present, send the valid rsvp", async () => {
    const rsvpsInRoom: RSVPReaction[] = [
      {
        status: "going",
        sender: 'alice',
        matrixEventId: 'event2'
      },
      {
        status: "notgoing",
        sender: 'alice',
        matrixEventId: 'event3'
      }
    ];

    const result: Status | null = calculateStatusToSend(rsvpsInRoom, 'event2');
    expect(result).toBe('notgoing');
  });
});