import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  createSvg,
  createTooltip,
  showTooltip,
  hideTooltip,
  formatDate,
  formatNumber,
  addGridLines,
  animateTransition,
  addAxisLabels,
  CHART_COLORS,
} from '../../../utils/d3/chartHelpers';
import { TimeSeriesData } from '../../../types/consultationHistory';

interface TimelineChartProps {
  data: TimeSeriesData[];
  width?: number;
  height?: number;
  color?: string;
}

export function TimelineChart({
  data,
  width = 800,
  height = 400,
  color = CHART_COLORS.primary
}: TimelineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;

    const { svg, g, chartWidth, chartHeight } = createSvg(
      containerRef.current,
      width,
      height
    );

    const tooltip = createTooltip(containerRef.current);

    const parseData = data.map(d => ({
      date: new Date(d.period),
      count: d.count
    }));

    const xScale = d3.scaleTime()
      .domain(d3.extent(parseData, d => d.date) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(parseData, d => d.count) || 0])
      .nice()
      .range([chartHeight, 0]);

    addGridLines(g, xScale, yScale, chartWidth, chartHeight);

    const xAxis = d3.axisBottom(xScale)
      .ticks(8)
      .tickFormat(d => formatDate(d as Date));

    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => formatNumber(d as number));

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

    const line = d3.line<{ date: Date; count: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    const area = d3.area<{ date: Date; count: number }>()
      .x(d => xScale(d.date))
      .y0(chartHeight)
      .y1(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    const areaGradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'areaGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.3);

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0);

    const areaPath = g.append('path')
      .datum(parseData)
      .attr('class', 'area')
      .attr('fill', 'url(#areaGradient)')
      .attr('d', area);

    const linePath = g.append('path')
      .datum(parseData)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2.5)
      .attr('d', line);

    const totalLength = (linePath.node() as SVGPathElement).getTotalLength();

    linePath
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition(animateTransition())
      .attr('stroke-dashoffset', 0);

    const dots = g.selectAll('.dot')
      .data(parseData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.count))
      .attr('r', 0)
      .attr('fill', color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6);

        const html = `
          <div class="font-semibold">${formatDate(d.date)}</div>
          <div class="text-xs mt-1">${formatNumber(d.count)} consultation${d.count > 1 ? 's' : ''}</div>
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
          .attr('r', 4);
        hideTooltip(tooltip);
      });

    dots
      .transition(animateTransition())
      .delay((d, i) => i * 50)
      .attr('r', 4);

    addAxisLabels(g, 'Période', 'Nombre de consultations', chartWidth, chartHeight);

    return () => {
      tooltip.remove();
    };
  }, [data, width, height, color]);

  return (
    <div className="relative">
      <div ref={containerRef} className="overflow-visible" />
    </div>
  );
}
