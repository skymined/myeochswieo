/**
 * 대한민국 공휴일 데이터 (2026, 2027)
 *
 * 출처: 「관공서의 공휴일에 관한 규정」(대통령령) 기준 + 행정안전부 발표 내용을
 * 교차 검증하여 수록. 특히 아래 두 항목은 여러 참고 자료에서 실수가 흔한
 * 지점이라 별도로 확인했다.
 *
 *  1) 제헌절(7/17)은 2008년부터 공휴일에서 제외되어 관공서가 정상 근무한다.
 *     (국경일이지만 '공휴일'은 아님 — 목록에 의도적으로 넣지 않음)
 *  2) 현충일·신정은 대체공휴일 적용 대상에서 제외된다. 대체공휴일 적용 대상은
 *     3·1절·광복절·개천절·한글날·설날연휴·추석연휴·어린이날·부처님오신날·
 *     기독탄신일이며, 이 규정에 따라 토요일과 겹칠 때도 대체공휴일이 생기는
 *     항목(3·1절/광복절/개천절/한글날/어린이날/부처님오신날/기독탄신일)과
 *     '일요일과 겹칠 때만' 생기는 항목(설날연휴/추석연휴)이 다르다.
 *     예) 2026년 추석 연휴(9/24~26, 목~토)는 마지막 날이 토요일과만 겹쳐
 *     대체공휴일이 발생하지 않는다.
 *
 * type: "holiday"(공휴일) | "substitute"(대체공휴일) | "worker"(근로자의 날,
 *       공식 관공서 공휴일 아님 — 사기업은 통상 유급휴무)
 *
 * 최종 확인일: 2026-08-20
 * 주의: 국회 의결로 임시공휴일이 추가 지정될 수 있으므로, 확정 전 정부 발표를
 *       함께 확인하는 것을 권장한다.
 */

const HOLIDAYS_2026 = [
  { date: "2026-01-01", name: "신정", type: "holiday" },
  { date: "2026-02-16", name: "설날 연휴", type: "holiday" },
  { date: "2026-02-17", name: "설날", type: "holiday" },
  { date: "2026-02-18", name: "설날 연휴", type: "holiday" },
  { date: "2026-03-01", name: "삼일절", type: "holiday" },
  { date: "2026-03-02", name: "삼일절 대체공휴일", type: "substitute" },
  { date: "2026-05-01", name: "근로자의 날", type: "worker" },
  { date: "2026-05-05", name: "어린이날", type: "holiday" },
  { date: "2026-05-24", name: "부처님오신날", type: "holiday" },
  { date: "2026-05-25", name: "부처님오신날 대체공휴일", type: "substitute" },
  { date: "2026-06-03", name: "전국동시지방선거", type: "holiday" },
  { date: "2026-06-06", name: "현충일", type: "holiday" },
  { date: "2026-08-15", name: "광복절", type: "holiday" },
  { date: "2026-08-17", name: "광복절 대체공휴일", type: "substitute" },
  { date: "2026-09-24", name: "추석 연휴", type: "holiday" },
  { date: "2026-09-25", name: "추석", type: "holiday" },
  { date: "2026-09-26", name: "추석 연휴", type: "holiday" },
  { date: "2026-10-03", name: "개천절", type: "holiday" },
  { date: "2026-10-05", name: "개천절 대체공휴일", type: "substitute" },
  { date: "2026-10-09", name: "한글날", type: "holiday" },
  { date: "2026-12-25", name: "성탄절", type: "holiday" },
];

const HOLIDAYS_2027 = [
  { date: "2027-01-01", name: "신정", type: "holiday" },
  { date: "2027-02-06", name: "설날 연휴", type: "holiday" },
  { date: "2027-02-07", name: "설날", type: "holiday" },
  { date: "2027-02-08", name: "설날 연휴", type: "holiday" },
  { date: "2027-02-09", name: "설날 대체공휴일", type: "substitute" },
  { date: "2027-03-01", name: "삼일절", type: "holiday" },
  { date: "2027-05-01", name: "근로자의 날", type: "worker" },
  { date: "2027-05-05", name: "어린이날", type: "holiday" },
  { date: "2027-05-13", name: "부처님오신날", type: "holiday" },
  { date: "2027-06-06", name: "현충일", type: "holiday" },
  { date: "2027-08-15", name: "광복절", type: "holiday" },
  { date: "2027-08-16", name: "광복절 대체공휴일", type: "substitute" },
  { date: "2027-09-14", name: "추석 연휴", type: "holiday" },
  { date: "2027-09-15", name: "추석", type: "holiday" },
  { date: "2027-09-16", name: "추석 연휴", type: "holiday" },
  { date: "2027-10-03", name: "개천절", type: "holiday" },
  { date: "2027-10-04", name: "개천절 대체공휴일", type: "substitute" },
  { date: "2027-10-09", name: "한글날", type: "holiday" },
  { date: "2027-10-11", name: "한글날 대체공휴일", type: "substitute" },
  { date: "2027-12-25", name: "성탄절", type: "holiday" },
  { date: "2027-12-27", name: "성탄절 대체공휴일", type: "substitute" },
];

const HOLIDAYS_BY_YEAR = {
  2026: HOLIDAYS_2026,
  2027: HOLIDAYS_2027,
};

const DATA_LAST_VERIFIED = "2026-08-20";
