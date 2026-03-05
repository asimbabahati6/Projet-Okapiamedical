import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CashFlowDataPoint } from '../../../types/billingAnalytics';
import {
  createSvg,
  createTooltip,
  showTooltip,
  hideTooltip,
  formatDate,
  addGridLines,
  animateTransition,
  CHART_COLORS,
} from '../../../utils/d3/chartHelpers';
import { formatCurrency } from '../../../utils/billingCalculations';

interface CashFlowTrendChartProps {
  data: CashFlowDataPoint[];
  width?: number;
  height?: number;
}

export function CashFlowTrendChart({
  data,
  width = 800,
  height = 400,
}: CashFlowTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const { svg, g, chartWidth, chartHeight } = createSvg(
      containerRef.current,
      width,
      height
    );

    const tooltip = createTooltip(containerRef.current);

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, chartWidth]);

    const maxValue = d3.max(data, d => Math.max(d.collected, d.pending)) || 0;

    const yScale = d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .nice()
      .range([chartHeight, 0]);

    addGridLines(g, xScale, yScale, chartWidth, chartHeight);

    const xAxis = d3.axisBottom(xScale)
      .ticks(8)
      .tickFormat(d => formatDate(d as Date));

    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => formatCurrency(d as number));

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('class', 'text-xs fill-gray-600')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .attr('class', 'text-xs fill-gray-600');

    const collectedLine = d3.line<CashFlowDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.collected))
      .curve(d3.curveMonotoneX);

    const collectedArea = d3.area<CashFlowDataPoint>()
      .x(d => xScale(d.date))
      .y0(chartHeight)
      .y1(d => yScale(d.collected))
      .curve(d3.curveMonotoneX);

    const collectedGradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'collectedGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    collectedGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', CHART_COLORS.success)
      .attr('stop-opacity', 0.4);

    collectedGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', CHART_COLORS.success)
      .attr('stop-opacity', 0.05);

    g.append('path')
      .datum(data)
      .attr('class', 'area-collected')
      .attr('fill', 'url(#collectedGradient)')
      .attr('d', collectedArea);

    const collectedPath = g.append('path')
      .datum(data)
      .attr('class', 'line-collected')
      .attr('fill', 'none')
      .attr('stroke', CHART_COLORS.success)
      .attr('stroke-width', 3)
      .attr('d', collectedLine);

    const totalLength = (collectedPath.node() as SVGPathElement).getTotalLength();

    collectedPath
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition(animateTransition())
      .attr('stroke-dashoffset', 0);

    const pendingLine = d3.line<CashFlowDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.pending))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('class', 'line-pending')
      .attr('fill', 'none')
      .attr('stroke', CHART_COLORS.warning)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('d', pendingLine);

    const dots = g.selectAll('.dot-collected')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot-collected')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.collected))
      .attr('r', 0)
      .attr('fill', CHART_COLORS.success)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 7);

        const html = `
          <div class="font-semibold mb-2">${formatDate(d.date)}</div>
          <div class="space-y-1">
            <div class="flex justify-between gap-4">
              <span class="text-green-600">● Collecté:</span>
              <span class="font-medium">${formatCurrency(d.collected)}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-orange-600">● En attente:</span>
              <span class="font-medium">${formatCurrency(d.pending)}</span>
            </div>
            <div class="flex justify-between gap-4 pt-1 border-t">
              <span class="font-medium">Net:</span>
              <span class="font-bold ${d.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}">
                ${formatCurrency(d.netFlow)}
              </span>
            </div>
          </div>
        `;
        showTooltip(tooltip, html, event);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 5);
        hideTooltip(tooltip);
      });

    dots
      .transition(animateTransition())
      .delay((d, i) => i * 30)
      .attr('r', 5);

    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 200}, 20)`);

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 30)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', CHART_COLORS.success)
      .attr('stroke-width', 3);

    legend.append('text')
      .attr('x', 40)
      .attr('y', 5)
      .attr('class', 'text-sm fill-gray-700')
      .text('Collecté');

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 30)
      .attr('y1', 25)
      .attr('y2', 25)
      .attr('stroke', CHART_COLORS.warning)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    legend.append('text')
      .attr('x', 40)
      .attr('y', 30)
      .attr('class', 'text-sm fill-gray-700')
      .text('En attente');

    return () => {
      tooltip.remove();
    };
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        Aucune donnée de flux de trésorerie disponible
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="overflow-visible" />
    </div>
  );
}
