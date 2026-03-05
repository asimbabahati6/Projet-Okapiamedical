import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  createSvg,
  createTooltip,
  showTooltip,
  hideTooltip,
  formatNumber,
  animateTransition,
  CHART_COLORS,
  wrapText,
} from '../../../utils/d3/chartHelpers';
import { DiagnosisDistribution } from '../../../types/consultationHistory';

interface DiagnosisDistributionChartProps {
  data: DiagnosisDistribution[];
  width?: number;
  height?: number;
  maxBars?: number;
}

export function DiagnosisDistributionChart({
  data,
  width = 800,
  height = 500,
  maxBars = 10
}: DiagnosisDistributionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;

    const margins = {
      top: 20,
      right: 40,
      bottom: 40,
      left: 200,
    };

    const { svg, g, chartWidth, chartHeight } = createSvg(
      containerRef.current,
      width,
      height,
      margins
    );

    const tooltip = createTooltip(containerRef.current);

    const topData = data
      .sort((a, b) => b.count - a.count)
      .slice(0, maxBars);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(topData, d => d.count) || 0])
      .nice()
      .range([0, chartWidth]);

    const yScale = d3.scaleBand()
      .domain(topData.map(d => d.diagnosis))
      .range([0, chartHeight])
      .padding(0.2);

    const colorScale = d3.scaleSequential()
      .domain([0, topData.length - 1])
      .interpolator(d3.interpolateBlues);

    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickFormat(d => formatNumber(d as number));

    const yAxis = d3.axisLeft(yScale);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('class', 'text-xs fill-gray-600');

    const yAxisGroup = g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    yAxisGroup.selectAll('text')
      .attr('class', 'text-xs fill-gray-700')
      .call(wrapText, margins.left - 10);

    const bars = g.selectAll('.bar')
      .data(topData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.diagnosis) || 0)
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', (d, i) => colorScale(i))
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.8);

        const html = `
          <div class="font-semibold">${d.diagnosis}</div>
          <div class="text-xs mt-1">${formatNumber(d.count)} cas (${d.percentage.toFixed(1)}%)</div>
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
          .attr('opacity', 1);
        hideTooltip(tooltip);
      });

    bars
      .transition(animateTransition())
      .delay((d, i) => i * 100)
      .attr('width', d => xScale(d.count));

    const labels = g.selectAll('.label')
      .data(topData)
      .enter()
      .append('text')
      .attr('class', 'label text-xs font-medium')
      .attr('x', d => xScale(d.count) + 5)
      .attr('y', d => (yScale(d.diagnosis) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#374151')
      .style('opacity', 0)
      .text(d => formatNumber(d.count));

    labels
      .transition(animateTransition())
      .delay((d, i) => i * 100 + 300)
      .style('opacity', 1);

    g.append('text')
      .attr('class', 'text-sm fill-gray-600 font-medium')
      .attr('text-anchor', 'middle')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 35)
      .text('Nombre de cas');

    return () => {
      tooltip.remove();
    };
  }, [data, width, height, maxBars]);

  return (
    <div className="relative">
      <div ref={containerRef} className="overflow-visible" />
    </div>
  );
}
