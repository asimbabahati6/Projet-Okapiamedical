import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  createTooltip,
  showTooltip,
  hideTooltip,
  formatDate,
  formatNumber,
} from '../../../utils/d3/chartHelpers';
import { HeatmapCell } from '../../../types/consultationHistory';

interface HeatmapCalendarProps {
  data: HeatmapCell[];
  width?: number;
  height?: number;
}

export function HeatmapCalendar({
  data,
  width = 900,
  height = 200
}: HeatmapCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;

    d3.select(containerRef.current).selectAll('*').remove();

    const cellSize = 18;
    const cellPadding = 2;
    const margins = { top: 30, right: 20, bottom: 20, left: 40 };

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'heatmap-calendar');

    const tooltip = createTooltip(containerRef.current);

    const maxValue = d3.max(data, d => d.value) || 0;

    const colorScale = d3.scaleSequential()
      .domain([0, maxValue])
      .interpolator(d3.interpolateBlues);

    const weeks = d3.max(data, d => d.week) || 0;
    const days = 7;

    const g = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top})`);

    const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    g.selectAll('.day-label')
      .data(dayLabels)
      .enter()
      .append('text')
      .attr('class', 'day-label text-xs fill-gray-600')
      .attr('x', -5)
      .attr('y', (d, i) => i * (cellSize + cellPadding) + cellSize / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .text(d => d);

    const cells = g.selectAll('.cell')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => d.week * (cellSize + cellPadding))
      .attr('y', d => d.day * (cellSize + cellPadding))
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 3)
      .attr('fill', d => d.value === 0 ? '#f3f4f6' : colorScale(d.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .style('opacity', 0)
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 2);

        const html = `
          <div class="font-semibold">${formatDate(d.date)}</div>
          <div class="text-xs mt-1">${formatNumber(d.value)} consultation${d.value > 1 ? 's' : ''}</div>
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
          .attr('stroke', '#fff')
          .attr('stroke-width', 1);
        hideTooltip(tooltip);
      });

    cells
      .transition()
      .duration(500)
      .delay((d, i) => i * 2)
      .style('opacity', 1);

    const legendWidth = 200;
    const legendHeight = 10;
    const legendMargin = 10;

    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - legendWidth - margins.right},${margins.top - 20})`);

    const legendScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => formatNumber(d as number));

    const defs = svg.append('defs');
    const linearGradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    linearGradient.selectAll('stop')
      .data(d3.range(0, 1.1, 0.1))
      .enter()
      .append('stop')
      .attr('offset', d => `${d * 100}%`)
      .attr('stop-color', d => colorScale(d * maxValue));

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('rx', 2)
      .style('fill', 'url(#legend-gradient)');

    legend.append('g')
      .attr('class', 'legend-axis')
      .attr('transform', `translate(0,${legendHeight})`)
      .call(legendAxis)
      .selectAll('text')
      .attr('class', 'text-xs fill-gray-600');

    legend.append('text')
      .attr('class', 'text-xs fill-gray-600')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .text('Nombre de consultations');

    return () => {
      tooltip.remove();
    };
  }, [data, width, height]);

  return (
    <div className="relative">
      <div ref={containerRef} className="overflow-x-auto overflow-y-visible" />
    </div>
  );
}
