import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CHART_COLORS } from '../../../utils/d3/chartHelpers';
import { formatPercentage } from '../../../utils/billingCalculations';

interface RecoveryRateGaugeProps {
  value: number;
  width?: number;
  height?: number;
  threshold?: number;
}

export function RecoveryRateGauge({
  value,
  width = 300,
  height = 200,
  threshold = 75,
}: RecoveryRateGaugeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    d3.select(containerRef.current).selectAll('*').remove();

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'gauge-chart');

    const centerX = width / 2;
    const centerY = height - 20;
    const radius = Math.min(width, height * 1.5) / 2 - 20;

    const startAngle = -Math.PI / 1.5;
    const endAngle = Math.PI / 1.5;

    const arcBackground = d3.arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(10);

    svg.append('path')
      .attr('d', arcBackground as any)
      .attr('transform', `translate(${centerX},${centerY})`)
      .attr('fill', '#E5E7EB')
      .attr('opacity', 0.3);

    const getColor = (val: number) => {
      if (val >= threshold) return CHART_COLORS.success;
      if (val >= threshold * 0.8) return CHART_COLORS.warning;
      return CHART_COLORS.danger;
    };

    const angleScale = d3.scaleLinear()
      .domain([0, 100])
      .range([startAngle, endAngle]);

    const targetAngle = angleScale(Math.min(100, Math.max(0, value)));

    const arcForeground = d3.arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius)
      .startAngle(startAngle)
      .cornerRadius(10);

    const foregroundPath = svg.append('path')
      .attr('transform', `translate(${centerX},${centerY})`)
      .attr('fill', getColor(value))
      .datum({ endAngle: startAngle });

    foregroundPath
      .transition()
      .duration(1500)
      .ease(d3.easeElastic.period(0.5))
      .attrTween('d', function(d: any) {
        const interpolate = d3.interpolate(d.endAngle, targetAngle);
        return function(t: number) {
          d.endAngle = interpolate(t);
          return arcForeground(d as any) || '';
        };
      });

    const thresholdAngle = angleScale(threshold);
    const thresholdRadius = radius + 10;

    svg.append('line')
      .attr('transform', `translate(${centerX},${centerY})`)
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', Math.cos(thresholdAngle) * thresholdRadius)
      .attr('y2', Math.sin(thresholdAngle) * thresholdRadius)
      .attr('stroke', '#EF4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.6);

    svg.append('circle')
      .attr('transform', `translate(${centerX},${centerY})`)
      .attr('cx', Math.cos(thresholdAngle) * thresholdRadius)
      .attr('cy', Math.sin(thresholdAngle) * thresholdRadius)
      .attr('r', 4)
      .attr('fill', '#EF4444');

    svg.append('text')
      .attr('transform', `translate(${centerX},${centerY})`)
      .attr('x', Math.cos(thresholdAngle) * (thresholdRadius + 15))
      .attr('y', Math.sin(thresholdAngle) * (thresholdRadius + 15))
      .attr('class', 'text-xs fill-red-600 font-medium')
      .attr('text-anchor', 'middle')
      .text(`${threshold}%`);

    const valueText = svg.append('text')
      .attr('x', centerX)
      .attr('y', centerY - 10)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-4xl font-bold')
      .attr('fill', getColor(value))
      .text('0%');

    valueText
      .transition()
      .duration(1500)
      .tween('text', function() {
        const i = d3.interpolate(0, value);
        return function(t: number) {
          d3.select(this).text(formatPercentage(i(t)));
        };
      });

    svg.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 15)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-sm fill-gray-600')
      .text('Taux de recouvrement');

    const ticks = [0, 25, 50, 75, 100];
    ticks.forEach(tick => {
      const angle = angleScale(tick);
      const tickRadius = radius + 5;

      svg.append('line')
        .attr('transform', `translate(${centerX},${centerY})`)
        .attr('x1', Math.cos(angle) * (radius * 0.7 - 5))
        .attr('y1', Math.sin(angle) * (radius * 0.7 - 5))
        .attr('x2', Math.cos(angle) * (radius * 0.7))
        .attr('y2', Math.sin(angle) * (radius * 0.7))
        .attr('stroke', '#9CA3AF')
        .attr('stroke-width', 2);

      svg.append('text')
        .attr('transform', `translate(${centerX},${centerY})`)
        .attr('x', Math.cos(angle) * (radius * 0.7 - 15))
        .attr('y', Math.sin(angle) * (radius * 0.7 - 15))
        .attr('text-anchor', 'middle')
        .attr('class', 'text-xs fill-gray-500')
        .text(`${tick}%`);
    });

  }, [value, width, height, threshold]);

  return (
    <div className="flex justify-center">
      <div ref={containerRef} />
    </div>
  );
}
