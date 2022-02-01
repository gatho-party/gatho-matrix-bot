import { MatrixJoinEvent } from "./interfaces";

export function generateLinkEventUrl(roomId: string, baseUrl: string) {
  const urlEncodedRoomId = encodeURIComponent(roomId);
  return `${baseUrl}/link-chat/${urlEncodedRoomId}`
}

export function isJoinEvent(event: MatrixJoinEvent | any): boolean {
  if(event.type = "m.room.member" && event.content.membership === "join") {
    return true;
  }
  return false;
}