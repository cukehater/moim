/** 운영자가 넣은 네이버 지도 링크, 없으면 장소명으로 네이버 지도 검색 */
export const mapHref = (location: string, mapUrl: string | null) =>
  mapUrl ?? `https://map.naver.com/p/search/${encodeURIComponent(location)}`
