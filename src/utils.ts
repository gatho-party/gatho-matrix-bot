import { MatrixInviteEvent, MatrixJoinEvent } from "./interfaces";

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

export function isInviteEvent(event: MatrixInviteEvent | any): boolean {
  if(event.type = "m.room.member" && event.content.membership === "invite") {
    return true;
  }
  return false;
}


export function parseMatrixUsernamePretty(matrix_username: string): string {
  if (matrix_username.includes(":") === false || matrix_username.includes("@") === false) {
    return matrix_username;
  }
  const withoutUrl = matrix_username.split(':')[0];
  return withoutUrl.split('@')[1]
}