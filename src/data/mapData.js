export const mapData = {
  areas: [
    { id: "central", name: "中央地区", type: "district", x: 180, y: 160, w: 170, h: 130 },
    { id: "mountain", name: "山あい集落", type: "district", x: 40, y: 70, w: 120, h: 105 },
    { id: "river", name: "川沿いエリア", type: "district", x: 355, y: 170, w: 150, h: 120 },
    { id: "tourism", name: "観光ゾーン", type: "district", x: 300, y: 50, w: 170, h: 90 },
  ],
  facilities: [
    { id: "hospital", name: "病院", icon: "🏥", x: 238, y: 194 },
    { id: "school", name: "学校", icon: "🏫", x: 128, y: 215 },
    { id: "cityhall", name: "市役所", icon: "🏛️", x: 228, y: 112 },
  ],
  rivers: [
    { id: "mainRiver", x: 330, y: -20, w: 48, h: 520 },
  ],
  roads: [
    { id: "mainRoadA", name: "幹線1号", type: "main", x: 60, y: 205, w: 420, h: 14 },
    { id: "mainRoadB", name: "幹線2号", type: "main", x: 220, y: 70, w: 14, h: 270 },
    { id: "oldRoad1", name: "旧道北ルート", type: "old", x: 85, y: 120, w: 185, h: 11 },
    { id: "oldRoad2", name: "旧道南ルート", type: "old", x: 215, y: 280, w: 190, h: 11 },
  ],
  bridges: [
    { id: "bridgeA", name: "さくら橋", x: 318, y: 130, w: 70, h: 20, area: "central" },
    { id: "bridgeB", name: "ひばり橋", x: 318, y: 230, w: 70, h: 20, area: "river" },
  ],
  infrastructures: [
    { id: "bridgeA", name: "さくら橋", kind: "bridge", condition: 69, importance: 90, burden: 12, area: "central", status: "safe" },
    { id: "bridgeB", name: "ひばり橋", kind: "bridge", condition: 48, importance: 72, burden: 16, area: "river", status: "warning" },
    { id: "mainRoadA", name: "幹線1号", kind: "road", condition: 67, importance: 88, burden: 11, area: "central", status: "safe" },
    { id: "mainRoadB", name: "幹線2号", kind: "road", condition: 61, importance: 84, burden: 9, area: "central", status: "safe" },
    { id: "oldRoad1", name: "旧道北ルート", kind: "road", condition: 43, importance: 41, burden: 15, area: "mountain", status: "warning" },
    { id: "oldRoad2", name: "旧道南ルート", kind: "road", condition: 37, importance: 36, burden: 17, area: "tourism", status: "danger" },
  ],
};
