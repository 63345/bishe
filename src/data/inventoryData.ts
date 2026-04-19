/**
 * 物资库存共享数据 & 生长阶段联动物资配置
 * ===================================================
 * 
 * 核心设计思路：
 * 每个养殖阶段都有其「关键物资」——如蜕壳期需要补钙剂和维生素，
 * 清塘期需要消毒用生石灰。当这些关键物资的库存低于预警线时，
 * 系统应在"生长周期看板"和"物资库存管理"两个页面同时亮红灯。
 */

// ========== 类型定义 ==========
export type InventoryItem = {
    id: number;
    code: string;
    name: string;
    category: string;
    spec: string;
    stock: number;
    warningLine: number;
    lastInDate: string;
    remark: string;
};

// ========== 初始 Mock 数据 ==========
export const INITIAL_INVENTORY: InventoryItem[] = [
    { id: 1, code: 'MAT-2026-001', name: '高蛋白颗粒饲料', category: '基础饲料', spec: 'kg', stock: 1200, warningLine: 500, lastInDate: '2026-03-18 14:30', remark: '蛋白质含量≥38%，适用于育肥期' },
    { id: 2, code: 'MAT-2026-002', name: '生石灰（消毒用）', category: '动保调水', spec: '包（25kg）', stock: 8, warningLine: 10, lastInDate: '2026-03-10 09:00', remark: '清塘消毒用，注意避水存放' },
    { id: 3, code: 'MAT-2026-003', name: '芽孢杆菌（调水用）', category: '动保调水', spec: '瓶（500g）', stock: 45, warningLine: 20, lastInDate: '2026-03-15 16:20', remark: '用于分解有机物、改善水质' },
    { id: 4, code: 'MAT-2026-004', name: '维生素C应激宁', category: '渔药', spec: '瓶（250ml）', stock: 3, warningLine: 5, lastInDate: '2026-02-28 11:00', remark: '蜕壳期抗应激，拌料投喂' },
    { id: 5, code: 'MAT-2026-005', name: '水草专用肥', category: '设备耗材', spec: 'kg', stock: 80, warningLine: 30, lastInDate: '2026-03-12 08:45', remark: '促进伊乐藻/轮叶黑藻生长' },
    { id: 6, code: 'MAT-2026-006', name: '离子钙补充剂', category: '动保调水', spec: '瓶（1L）', stock: 2, warningLine: 8, lastInDate: '2026-02-20 10:00', remark: '蜕壳期补钙，促进新壳硬化' },
    { id: 7, code: 'MAT-2026-007', name: '聚维酮碘消毒液', category: '渔药', spec: '桶（5L）', stock: 12, warningLine: 5, lastInDate: '2026-03-05 15:30', remark: '水体杀菌消毒，蜕壳前后使用' },
];

// ========== 生长阶段 - 关键物资映射 ==========
// 每个阶段绑定该时期最紧需的物资名称
export type StageMaterialConfig = {
    stageName: string;
    months: number[];
    criticalMaterials: string[];   // 关键物资名称（模糊匹配）
    reason: string;                // 为什么这个阶段需要这些物资
};

export const STAGE_MATERIAL_MAP: StageMaterialConfig[] = [
    {
        stageName: '扣蟹入池',
        months: [2, 3],
        criticalMaterials: ['生石灰', '水草专用肥', '聚维酮碘'],
        reason: '放苗前需彻底清塘消毒，栽种水草需要专用肥'
    },
    {
        stageName: '第一次蜕壳',
        months: [4],
        criticalMaterials: ['维生素C', '离子钙', '芽孢杆菌'],
        reason: '首次蜕壳应激大，需备足抗应激药物与补钙剂'
    },
    {
        stageName: '第二次蜕壳',
        months: [5],
        criticalMaterials: ['离子钙', '维生素C', '高蛋白颗粒饲料'],
        reason: '集中蜕壳期需大量补钙与营养强化'
    },
    {
        stageName: '第三次蜕壳',
        months: [6],
        criticalMaterials: ['高蛋白颗粒饲料', '芽孢杆菌', '离子钙'],
        reason: '高温前最后储备期，增强体质防高温应激'
    },
    {
        stageName: '第四次蜕壳',
        months: [7],
        criticalMaterials: ['芽孢杆菌', '高蛋白颗粒饲料', '聚维酮碘'],
        reason: '度夏期水质容易恶化，需加强调水和消毒'
    },
    {
        stageName: '第五次蜕壳',
        months: [8],
        criticalMaterials: ['维生素C', '高蛋白颗粒饲料', '离子钙'],
        reason: '最后蜕壳冲刺，补钙促壳硬化+育肥'
    },
    {
        stageName: '成熟采收',
        months: [9, 10, 11],
        criticalMaterials: ['高蛋白颗粒饲料'],
        reason: '育肥上市期，保证饲料充足'
    },
];

/**
 * 获取当前阶段配置
 */
export function getCurrentStageConfig(): StageMaterialConfig | null {
    const month = new Date().getMonth() + 1;
    return STAGE_MATERIAL_MAP.find(s => s.months.includes(month)) || null;
}

/**
 * 获取当前阶段的关键物资预警列表
 * @param inventory 当前的库存数据
 * @returns 需要预警的物资列表（关键物资且库存不足的）
 */
export function getStageCriticalAlerts(inventory: InventoryItem[]): {
    stageConfig: StageMaterialConfig | null;
    criticalItems: (InventoryItem & { isCritical: boolean; isLow: boolean })[];
    alertCount: number;
} {
    const stageConfig = getCurrentStageConfig();
    if (!stageConfig) return { stageConfig: null, criticalItems: [], alertCount: 0 };

    const criticalItems = inventory
        .filter(item => stageConfig.criticalMaterials.some(mat => item.name.includes(mat)))
        .map(item => ({
            ...item,
            isCritical: true,
            isLow: item.stock <= item.warningLine
        }));

    return {
        stageConfig,
        criticalItems,
        alertCount: criticalItems.filter(i => i.isLow).length
    };
}
