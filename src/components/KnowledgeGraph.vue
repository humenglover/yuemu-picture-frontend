<template>
  <div class="yuemu-knowledge-graph-container">
    <div class="yuemu-relation-filter">
      <div class="yuemu-title">{{ t('components.knowledgeGraph.relationFilter') }}</div>
      <div class="yuemu-ios-segmented-control">
        <button
          v-for="filter in filters"
          :key="filter.type"
          :class="['yuemu-segment-btn', { 'yuemu-active': currentFilter === filter.type }]"
          @click="changeFilter(filter.type)"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>
    <div ref="graphContainer" class="yuemu-graph-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { useI18n } from 'vue-i18n';
import type { ComposeOption } from 'echarts/core';
import type { GraphSeriesOption } from 'echarts/charts';
import type { TooltipComponentOption, LegendComponentOption } from 'echarts/components';

interface GraphNode {
  id: number;
  name: string;
  label: string;
  category: number;
  symbolSize: number;
  tableDesc: string;
  categoryName?: string;
}

interface GraphLink {
  source: number;
  target: number;
  name: string;
  type: string;
  desc: string;
}

interface GraphCategory {
  name: string;
  itemStyle: {
    color: string;
  };
}

interface Filter {
  type: string;
  label: string;
}

type ECOption = ComposeOption<GraphSeriesOption | TooltipComponentOption | LegendComponentOption>;

const graphContainer = ref<HTMLDivElement | null>(null);
let myChart: echarts.ECharts | null = null;
const currentFilter = ref('core');
const { t, tm } = useI18n();

const filters = computed<Filter[]>(() => [
  { type: 'core', label: t('components.knowledgeGraph.coreBusiness') },
  { type: 'interact', label: t('components.knowledgeGraph.interactAction') },
  { type: 'all', label: t('components.knowledgeGraph.allRelations') }
]);

const rawGraphData = computed(() => tm('components.knowledgeGraph.graphData') as any);
const graphData = computed(() => ({
  nodes: rawGraphData.value.nodes || [],
  links: rawGraphData.value.links || [],
  categories: rawGraphData.value.categories || []
}));

graphData.value.nodes.forEach((node: GraphNode) => {
  node.categoryName = graphData.value.categories[node.category].name;
});

const filterLinks = (filterType: string) => {
  switch (filterType) {
    case 'core': return graphData.value.links.filter(link => link.type === 'core');
    case 'interact': return graphData.value.links.filter(link => link.type === 'interact');
    case 'all': return graphData.value.links;
    default: return graphData.value.links.filter(link => link.type === 'core');
  }
};

const getEchartsOption = (filterType: string) => {
  const isMobile = window.innerWidth <= 768;
  return {
    title: {
      text: t('components.knowledgeGraph.graphTitle'),
      left: 'center',
      top: 10,
      textStyle: { fontSize: isMobile ? 16 : 18, color: '#1e293b', fontWeight: 600 }
    },
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 12,
      textStyle: { color: '#1e293b', fontSize: 13 },
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          return `<div style="max-width: 250px; white-space: normal;">
                      <div style="color: #2563eb; font-weight: 600; margin-bottom: 4px;">【${(params.data as GraphNode).categoryName}】</div>
                      <div><span style="color: #64748b;">${t('components.knowledgeGraph.tableName')}</span>${(params.data as GraphNode).name}（${(params.data as GraphNode).label.split('\n')[1]}）</div>
                      <div style="margin-top: 4px;"><span style="color: #64748b;">${t('components.knowledgeGraph.description')}</span>${(params.data as GraphNode).tableDesc}</div>
                  </div>`;
        } else if (params.dataType === 'edge') {
          const sourceNode = graphData.value.nodes.find((node: GraphNode) => node.id === (params.data as GraphLink).source);
          const targetNode = graphData.value.nodes.find((node: GraphNode) => node.id === (params.data as GraphLink).target);
          return `<div style="max-width: 250px; white-space: normal;">
                      <div><span style="color: #64748b;">${t('components.knowledgeGraph.relationType')}</span>${params.data.type === 'core' ? t('components.knowledgeGraph.coreRelation') : t('components.knowledgeGraph.interactRelation')}</div>
                      <div style="margin: 4px 0;"><span style="color: #64748b;">${t('components.knowledgeGraph.associated')}</span>${sourceNode?.name} → ${targetNode?.name}</div>
                      <div><span style="color: #64748b;">${t('components.knowledgeGraph.relation')}</span>${params.data.name}</div>
                      <div style="margin-top: 4px;"><span style="color: #64748b;">${t('components.knowledgeGraph.description')}</span>${params.data.desc}</div>
                  </div>`;
        }
        return '';
      }
    },
    legend: {
      orient: isMobile ? 'horizontal' : 'vertical',
      top: isMobile ? 'auto' : 'center',
      bottom: isMobile ? 15 : 'auto',
      left: isMobile ? 'center' : 'right',
      data: graphData.value.categories.map((cate: any) => cate.name),
      textStyle: { fontSize: 12, color: '#475569' },
      itemWidth: 12,
      itemHeight: 12
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: graphData.value.nodes,
        links: filterLinks(filterType),
        categories: graphData.value.categories,
        roam: true,
        zoom: isMobile ? 0.8 : 1,
        label: { show: true, position: 'inside', fontSize: isMobile ? 10 : 12, color: '#ffffff', fontWeight: 500 },
        force: {
          repulsion: isMobile ? 120 : 220,
          edgeLength: isMobile ? 70 : 110,
          gravity: 0.1,
          layoutAnimation: true
        },
        lineStyle: { color: 'source', curveness: 0.1, width: 1.2 },
        emphasis: { focus: 'adjacency', lineStyle: { width: 2.5 } }
      }
    ]
  };
};

const changeFilter = (filterType: string) => {
  currentFilter.value = filterType;
  if (myChart) myChart.setOption(getEchartsOption(filterType));
};

const initChart = () => {
  if (!graphContainer.value) return;
  myChart = echarts.init(graphContainer.value);
  myChart.setOption(getEchartsOption(currentFilter.value));
};

const handleResize = () => {
  if (myChart) {
    myChart.setOption(getEchartsOption(currentFilter.value));
    myChart.resize();
  }
};

onMounted(() => {
  nextTick(() => initChart());
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (myChart) myChart.dispose();
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.yuemu-knowledge-graph-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--background, #f8f9fa);
  padding: 16px;
  box-sizing: border-box;
}

.yuemu-relation-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--card-background, #ffffff);
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.yuemu-relation-filter .yuemu-title {
  font-size: 15px;
  color: var(--text-primary, #1e293b);
  font-weight: 600;
  margin-right: 16px;
}

.yuemu-ios-segmented-control {
  display: flex;
  background-color: var(--hover-background, #f1f5f9);
  border-radius: 8px;
  padding: 2px;
  flex: 1;
  max-width: 400px;
}

.yuemu-segment-btn {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 12px;
  border-radius: 6px;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: center;
}

.yuemu-segment-btn.yuemu-active {
  background-color: var(--card-background, #ffffff);
  color: var(--text-primary, #0f172a);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.yuemu-graph-container {
  flex: 1;
  width: 100%;
  border-radius: 12px;
  background-color: var(--card-background, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  min-height: 500px;
}

@media screen and (max-width: 768px) {
  .yuemu-knowledge-graph-container {
    padding: 12px;
    padding-bottom: env(safe-area-inset-bottom, 24px);
  }
  .yuemu-relation-filter {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    gap: 12px;
  }
  .yuemu-relation-filter .yuemu-title { margin-right: 0; font-size: 14px; }
  .yuemu-ios-segmented-control { width: 100%; max-width: none; }
  .yuemu-segment-btn { padding: 8px 4px; font-size: 12px; }
  .yuemu-graph-container {
    min-height: 450px;
    height: 60dvh;
  }
}
</style>
