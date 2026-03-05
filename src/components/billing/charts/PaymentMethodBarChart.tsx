import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { PaymentMethodStats } from '../../../types/billingAnalytics';
import {
  createSvg,
  createTooltip,
  showTooltip,
  hideTooltip,
  addGridLines,
  animateTransition,
  CHART_COLORS,
} from '../../../utils/d3/chartHelpers';
import { formatCurrency, formatPercentage } from '../../../utils/billingCalculations';

interface PaymentMethodBarChartProps {
  data: PaymentMethodStats[];
  width?: number;
  height?: number;
}

const METHOD_COLORS: Record<string, string> = {
  'Espèces': CHART_COLORS.success,
  'Carte bancaire': CHART_COLORS.primary,
  'Mobile Money': CHART_COLORS.warning,
  'Assurance': CHART_COLORS.danger,
  'bank_transfer': '#8B5CF6',
};

export function PaymentMethodBarChart({
  data,
  width = 800,
  height = 400,
}: PaymentMethodBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const { svg, g, chartWidth, chartHeight } = createSvg(
      containerRef.current,
      width,
      height
    );

    const tooltip = createTooltip(containerRef.current);

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.method))
      .range([0, chartWidth])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.amount) || 0])
      .nice()
      .range([chartHeight, 0]);

    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => formatCurrency(d as number));

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .attr('class', 'text-xs fill-gray-600');

    addGridLines(g, xScale as any, yScale, chartWidth, chartHeight);

    const bars = g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.method)!)
      .attr('y', chartHeight)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', d => METHOD_COLORS[d.method] || CHART_COLORS.primary)
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.8);

        const html = `
          <div class="font-semibold mb-2">${d.method}</div>
          <div class="space-y-1">
            <div class="flex justify-between gap-4">
              <span>Montant:</span>
              <span class="font-medium">${formatCurrency(d.amount)}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span>Transactions:</span>
              <span class="font-medium">${d.count}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span>Part:</span>
              <span class="font-medium">${formatPercentage(d.percentage)}</span>
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
          .attr('opacity', 1);
        hideTooltip(tooltip);
      });

    bars
      .transition(animateTransition())
      .delay((d, i) => i * 100)
      .attr('y', d => yScale(d.amount))
      .attr('height', d => chartHeight - yScale(d.amount));

    g.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label text-xs fill-gray-700 font-medium')
      .attr('x', d => xScale(d.method)! + xScale.bandwidth() / 2)
      .attr('y', chartHeight + 20)
      .attr('text-anchor', 'middle')
      .text(d => d.method)
      .style('opacity', 0)
      .transition(animateTransition())
      .delay((d, i) => i * 100)
      .style('opacity', 1);

    g.selectAll('.value-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'value-label text-xs font-semibold')
      .attr('x', d => xScale(d.method)! + xScale.bandwidth() / 2)
      .attr('y', chartHeight)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .style('opacity', 0)
      .text(d => formatCurrency(d.amount))
      .transition(animateTransition())
      .delay((d, i) => i * 100 + 300)
      .attr('y', d => yScale(d.amount) + 20)
      .style('opacity', 1);

    return () => {
      tooltip.remove();
    };
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        Aucune donnée de méthodes de paiement disponible
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="overflow-visible" />
    </div>
  );
}
