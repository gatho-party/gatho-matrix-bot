
import { RSVPCount, RSVPReaction } from '../src/interfaces';
import { sendRSVP, Status } from '../src/gatho-api';
import { emojiMap } from '../src/common-interfaces';
import { calculateStatusToSend } from '../src/update-rsvp-count';
describe("#calculateStatusToSend()", () => {
  const emojiMap: { [key: string]: Status; } = {
    "up": 'going',
    "down": 'notgoing',
    "thinking": 'maybe'
  }

  test("when no other rsvps are present, status is invited", async () => {
    const rsvpsInRoom: RSVPReaction[] = [
      {
        reaction: "up",
        sender: 'alice',
        matrixEventId: 'event1'
      }
    ];

    const result: Status | null = calculateStatusToSend(rsvpsInRoom, 'event1', emojiMap);
    expect(result).toBe('invited');
  });

  test("when going rsvps also present, status is going", async () => {
    const rsvpsInRoom: RSVPReaction[] = [
      {
        reaction: "up",
        sender: 'alice',
        matrixEventId: 'event1'
      },
      {
        reaction: "down",
        sender: 'alice',
        matrixEventId: 'event2'
      }
    ];

    const result: Status | null = calculateStatusToSend(rsvpsInRoom, 'event2', emojiMap);
    expect(result).toBe('going');
  });
  test("when removing going, and notgoing rsvps also present, status is notgoing", async () => {
    const rsvpsInRoom: RSVPReaction[] = [
      {
        reaction: "down",
        sender: 'alice',
        matrixEventId: 'event1'
      },
      {
        reaction: "up",
        sender: 'alice',
        matrixEventId: 'event2'
      }
    ];

    const result: Status | null = calculateStatusToSend(rsvpsInRoom, 'event2', emojiMap);
    expect(result).toBe('notgoing');
  });

  test("when going and maybe rsvps also present, don't send any status", async () => {
    const rsvpsInRoom: RSVPReaction[] = [
      {
        reaction: "thinking",
        sender: 'alice',
        matrixEventId: 'event1'
      },
      {
        reaction: "up",
        sender: 'alice',
        matrixEventId: 'event2'
      },
      {
        reaction: "down",
        sender: 'alice',
        matrixEventId: 'event3'
      }
    ];

    const result: Status | null = calculateStatusToSend(rsvpsInRoom, 'event2', emojiMap);
    expect(result).toBe(null);
  });
  test("when one valid rsvp present, and one random reaction, send the valid rsvp", async () => {
    const rsvpsInRoom: RSVPReaction[] = [
      {
        reaction: "WOOOOO",
        sender: 'alice',
        matrixEventId: 'event1'
      },
      {
        reaction: "up",
        sender: 'alice',
        matrixEventId: 'event2'
      },
      {
        reaction: "down",
        sender: 'alice',
        matrixEventId: 'event3'
      }
    ];

    const result: Status | null = calculateStatusToSend(rsvpsInRoom, 'event2', emojiMap);
    expect(result).toBe('notgoing');
  });
});