export function generateLinkEventUrl(roomId: string, baseUrl: string) {
  const urlEncodedRoomId = encodeURIComponent(roomId);
  return `${baseUrl}/link-chat/${urlEncodedRoomId}`
}