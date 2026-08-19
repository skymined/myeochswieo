/**
 * 대한민국 공휴일 데이터 (2026, 2027)
 *
 * 출처: 「공휴일에 관한 법률」(법률 제21338호, 2026-02-10 공포, 2026-05-11 시행) +
 * 「관공서의 공휴일에 관한 규정」(대통령령 제36290호, 2026-04-30 공포) 기준으로
 * 교차 검증하여 수록.
 *
 * ⚠️ 2026년에 생긴 중요한 법 개정 두 건 — 예전 자료(2025년 이전에 쓰인 글 등)를
 * 참고하면 반드시 틀리는 지점이라 명시해둔다:
 *
 *  1) 제헌절(7/17): 2008년 공휴일에서 제외됐다가, 2026년 1월 29일 국회 본회의
 *     가결로 18년 만에 공휴일로 복원됐다. 대체공휴일 적용 대상에도 포함된다
 *     (토·일요일 및 다른 공휴일과 겹치면 대체공휴일 발생).
 *  2) 근로자의 날/노동절(5/1): 기존에는 근로기준법상 유급휴일일 뿐 관공서
 *     공휴일이 아니어서 공무원·학교는 정상 근무했다. 2026년 4월 6일 국무회의
 *     의결로 정식 법정 공휴일(관공서 공휴일)로 격상되어, 2026년부터는 공무원·
 *     학교를 포함한 전 국민이 함께 쉰다. 대체공휴일 적용 대상에도 포함된다.
 *     (이 사이트도 예전에는 이 날을 토글로 선택하게 했었는데, 이제는 그냥
 *     모두가 쉬는 날이라 토글을 없애고 일반 공휴일로 표시한다.)
 *
 * 대체공휴일 적용 대상 전체 목록(2026년 기준): 설날연휴·추석연휴(일요일 및
 * 다른 공휴일과 겹칠 때만), 3·1절·어린이날·광복절·개천절·한글날·부처님오신날·
 * 성탄절·제헌절·근로자의날(토·일요일 및 다른 공휴일과 겹치면 모두 발생).
 * 신정과 현충일은 여전히 대체공휴일 적용 대상이 아니다.
 *
 * type: "holiday"(공휴일) | "substitute"(대체공휴일)
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
  { date: "2026-05-01", name: "근로자의 날(노동절)", type: "holiday" },
  { date: "2026-05-05", name: "어린이날", type: "holiday" },
  { date: "2026-05-24", name: "부처님오신날", type: "holiday" },
  { date: "2026-05-25", name: "부처님오신날 대체공휴일", type: "substitute" },
  { date: "2026-06-03", name: "전국동시지방선거", type: "holiday" },
  { date: "2026-06-06", name: "현충일", type: "holiday" },
  { date: "2026-07-17", name: "제헌절", type: "holiday" },
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
  { date: "2027-05-01", name: "근로자의 날(노동절)", type: "holiday" },
  { date: "2027-05-03", name: "근로자의 날(노동절) 대체공휴일", type: "substitute" },
  { date: "2027-05-05", name: "어린이날", type: "holiday" },
  { date: "2027-05-13", name: "부처님오신날", type: "holiday" },
  { date: "2027-06-06", name: "현충일", type: "holiday" },
  { date: "2027-07-17", name: "제헌절", type: "holiday" },
  { date: "2027-07-19", name: "제헌절 대체공휴일", type: "substitute" },
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
