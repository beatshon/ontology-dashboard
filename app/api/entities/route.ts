export const runtime = "edge";

import { AREAS, fetchAreaData } from "@/lib/notion";

interface EntityNode {
  id: string;
  label: string;
  type: "person" | "place" | "keyword";
  count: number;
}

interface EntityEdge {
  source: string;
  target: string;
  weight: number;
}

// Patterns for entity extraction
const PERSON_VERBS = /(?:만남|만났|연락|대화|통화|미팅|약속|식사|점심|저녁|회의|상담|코칭|멘토링|인사)\s*(.*?)(?:[,.\n을를이가과와]|$)/g;
const PERSON_WITH_SUFFIX = /([가-힣]{2,4})(님|씨|선배|후배|형|누나|언니|오빠|팀장|대리|과장|부장|사장|대표)/g;
const PLACE_EMOJI = /📍\s*(.*?)(?:[,.\n]|$)/g;
const LOCATION_SUFFIX = /([가-힣]{2,10})(카페|식당|병원|공원|역|센터|호텔|학교|대학|빌딩|타워|몰|마트|점|관|원|장|터미널|공항|문화|극장|영화관|체육관|헬스)/g;

// Korean stopwords to exclude from keyword extraction
const STOPWORDS = new Set([
  "것", "수", "등", "때", "중", "년", "월", "일", "분", "초",
  "더", "좀", "잘", "안", "못", "다", "또", "이", "그", "저",
  "오늘", "내일", "어제", "지금", "이번", "다음", "정도", "매우",
  "하기", "되기", "있기", "없기", "하는", "되는", "있는", "없는",
  "했다", "됐다", "있다", "없다", "한다", "된다", "같다", "보다",
  "대한", "위한", "통한", "따른", "관한", "의한",
  "기록", "내용", "생각", "부분", "정리", "확인", "완료", "시작",
  "계속", "진행", "필요", "예정", "가능", "결과", "방법", "사용",
]);

function extractPersons(text: string): string[] {
  const persons: string[] = [];

  // Pattern 1: Names after relationship verbs
  let match: RegExpExecArray | null;
  const verbRegex = new RegExp(PERSON_VERBS.source, "g");
  while ((match = verbRegex.exec(text)) !== null) {
    const name = match[1]?.trim();
    if (name && name.length >= 2 && name.length <= 6) {
      persons.push(name);
    }
  }

  // Pattern 2: Names with Korean suffixes (님, 씨, etc.)
  const suffixRegex = new RegExp(PERSON_WITH_SUFFIX.source, "g");
  while ((match = suffixRegex.exec(text)) !== null) {
    const name = match[1]?.trim();
    if (name && name.length >= 2) {
      persons.push(name);
    }
  }

  return persons;
}

function extractPlaces(text: string): string[] {
  const places: string[] = [];

  // Pattern 1: After 📍 emoji
  let match: RegExpExecArray | null;
  const emojiRegex = new RegExp(PLACE_EMOJI.source, "g");
  while ((match = emojiRegex.exec(text)) !== null) {
    const place = match[1]?.trim();
    if (place && place.length >= 2) {
      places.push(place);
    }
  }

  // Pattern 2: Location with known suffixes
  const locationRegex = new RegExp(LOCATION_SUFFIX.source, "g");
  while ((match = locationRegex.exec(text)) !== null) {
    const fullPlace = (match[1] + match[2]).trim();
    if (fullPlace.length >= 2) {
      places.push(fullPlace);
    }
  }

  return places;
}

function extractKeywords(text: string): string[] {
  // Extract Korean nouns (2-6 chars, appear 2+ times across all records)
  const words = text.match(/[가-힣]{2,6}/g) || [];
  return words.filter((w) => !STOPWORDS.has(w));
}

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
};

export async function GET() {
  try {
    // Fetch recent records from all areas
    const allRecords: Array<{ id: string; text: string }> = [];

    const batchSize = 4;
    for (let i = 0; i < AREAS.length; i += batchSize) {
      const batch = AREAS.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((a) => fetchAreaData(a, 10))
      );

      for (const areaData of results) {
        for (const record of areaData.records) {
          const text = [record.title || "", record.content || ""].join(" ").trim();
          if (text.length > 0) {
            allRecords.push({ id: record.id, text });
          }
        }
      }
    }

    // Extract entities per record
    const personCounts = new Map<string, number>();
    const placeCounts = new Map<string, number>();
    const wordCounts = new Map<string, number>();
    const cooccurrences = new Map<string, Map<string, number>>();

    const recordEntities: Array<{ recordId: string; entities: string[] }> = [];

    for (const record of allRecords) {
      const entities: string[] = [];

      // Extract persons
      const persons = extractPersons(record.text);
      for (const p of persons) {
        personCounts.set(p, (personCounts.get(p) || 0) + 1);
        entities.push(`person:${p}`);
      }

      // Extract places
      const places = extractPlaces(record.text);
      for (const p of places) {
        placeCounts.set(p, (placeCounts.get(p) || 0) + 1);
        entities.push(`place:${p}`);
      }

      // Extract keywords
      const words = extractKeywords(record.text);
      for (const w of words) {
        wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
      }

      recordEntities.push({ recordId: record.id, entities });
    }

    // Filter keywords to 2+ occurrences, take top 10
    const topKeywords = [...wordCounts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Add keywords to record entities
    for (const record of allRecords) {
      const words = extractKeywords(record.text);
      const topKeywordSet = new Set(topKeywords.map(([k]) => k));
      const matchingKeywords = words.filter((w) => topKeywordSet.has(w));
      const re = recordEntities.find(
        (r) => allRecords.find((ar) => ar.id === record.id)?.id === r.recordId
      );
      if (re) {
        for (const kw of matchingKeywords) {
          re.entities.push(`keyword:${kw}`);
        }
      }
    }

    // Build co-occurrence edges
    for (const { entities } of recordEntities) {
      const unique = [...new Set(entities)];
      for (let i = 0; i < unique.length; i++) {
        for (let j = i + 1; j < unique.length; j++) {
          const a = unique[i];
          const b = unique[j];
          if (!cooccurrences.has(a)) cooccurrences.set(a, new Map());
          if (!cooccurrences.has(b)) cooccurrences.set(b, new Map());
          cooccurrences.get(a)!.set(b, (cooccurrences.get(a)!.get(b) || 0) + 1);
          cooccurrences.get(b)!.set(a, (cooccurrences.get(b)!.get(a) || 0) + 1);
        }
      }
    }

    // Build nodes
    const nodes: EntityNode[] = [];

    for (const [name, count] of personCounts) {
      if (count >= 1) {
        nodes.push({ id: `person:${name}`, label: name, type: "person", count });
      }
    }

    for (const [name, count] of placeCounts) {
      if (count >= 1) {
        nodes.push({ id: `place:${name}`, label: name, type: "place", count });
      }
    }

    for (const [word, count] of topKeywords) {
      nodes.push({ id: `keyword:${word}`, label: word, type: "keyword", count });
    }

    // Build edges
    const edges: EntityEdge[] = [];
    const edgeSet = new Set<string>();

    for (const [source, targets] of cooccurrences) {
      for (const [target, weight] of targets) {
        const edgeKey = [source, target].sort().join("||");
        if (!edgeSet.has(edgeKey) && nodes.some((n) => n.id === source) && nodes.some((n) => n.id === target)) {
          edgeSet.add(edgeKey);
          edges.push({ source, target, weight });
        }
      }
    }

    // Limit to top 20 nodes and their edges
    const topNodes = nodes.sort((a, b) => b.count - a.count).slice(0, 20);
    const topNodeIds = new Set(topNodes.map((n) => n.id));
    const filteredEdges = edges.filter(
      (e) => topNodeIds.has(e.source) && topNodeIds.has(e.target)
    );

    return Response.json(
      { nodes: topNodes, edges: filteredEdges },
      { headers: CACHE_HEADERS }
    );
  } catch {
    return Response.json({ nodes: [], edges: [] });
  }
}
