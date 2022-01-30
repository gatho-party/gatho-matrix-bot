import { generateLinkEventUrl } from "../src/utils";

describe("generateLinkEventUrl#()", () => {
  test("when no other rsvps are present, status is invited", async () => {
    const url: string = generateLinkEventUrl('!aqBUWoYrLqnWKlazzz:domain.com', "https://gatho.party");
    expect(url).toMatchInlineSnapshot(`"https://gatho.party/link-chat/!aqBUWoYrLqnWKlazzz%3Adomain.com"`);
  });
});
