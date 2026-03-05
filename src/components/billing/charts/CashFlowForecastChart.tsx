import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ForecastResult } from '../../../types/billingAnalytics';
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
import { formatCurrency, formatPercentage } from '../../../utils/billingCalculations';

interface CashFlowForecastChartProps {
  forecast: ForecastResult;
  width?: number;
  height?: number;
}

export function CashFlowForecastChart({
  forecast,
  width = 800,
  height = 400,
}: CashFlowForecastChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || forecast.forecasts.length === 0) return;

    const { svg, g, chartWidth, chartHeight } = createSvg(
      containerRef.current,
      width,
      height
    );

    const tooltip = createTooltip(containerRef.current);

    const historicalDates = forecast.historicalData.map(d => d.date);
    const forecastDates = forecast.forecasts.map(d => d.date);
    const allDates = [...historicalDates, ...forecastDates];

    const xScale = d3.scaleTime()
      .domain([d3.min(allDates)!, d3.max(allDates)!])
      .range([0, chartWidth]);

    const allValues = [
      ...forecast.historicalData.map(d => d.collected),
      ...forecast.forecasts.flatMap(d => [d.optimistic, d.realistic, d.pessimistic]),
    ];

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(allValues) || 0])
      .nice()
      .range([chartHeight, 0]);

    addGridLines(g, xScale, yScale, chartWidth, chartHeight);

    const xAxis = d3.axisBottom(xScale)
      .ticks(10)
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

    const historicalLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.collected))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(forecast.historicalData)
      .attr('class', 'historical-line')
      .attr('fill', 'none')
      .attr('stroke', CHART_COLORS.primary)
      .attr('stroke-width', 3)
      .attr('d', historicalLine);

    const confidenceArea = d3.area<any>()
      .x(d => xScale(d.date))
      .y0(d => yScale(d.pessimistic))
      .y1(d => yScale(d.optimistic))
      .curve(d3.curveMonotoneX);

    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'confidenceGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', CHART_COLORS.info)
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', CHART_COLORS.info)
      .attr('stop-opacity', 0.1);

    g.append('path')
      .datum(forecast.forecasts)
      .attr('class', 'confidence-area')
      .attr('fill', 'url(#confidenceGradient)')
      .attr('d', confidenceArea);

    const realisticLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.realistic))
      .curve(d3.curveMonotoneX);

    const forecastPath = g.append('path')
      .datum(forecast.forecasts)
      .attr('class', 'forecast-line')
      .attr('fill', 'none')
      .attr('stroke', CHART_COLORS.info)
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '8,4')
      .attr('d', realisticLine);

    const totalLength = (forecastPath.node() as SVGPathElement).getTotalLength();

    forecastPath
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition(animateTransition())
      .delay(500)
      .attr('stroke-dashoffset', 0);

    const dividerX = xScale(forecast.forecasts[0].date);
    g.append('line')
      .attr('x1', dividerX)
      .attr('x2', dividerX)
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#EF4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.5);

    g.append('text')
      .attr('x', dividerX - 5)
      .attr('y', -5)
      .attr('text-anchor', 'end')
      .attr('class', 'text-xs fill-gray-600 font-medium')
      .text('Historique');

    g.append('text')
      .attr('x', dividerX + 5)
      .attr('y', -5)
      .attr('text-anchor', 'start')
      .attr('class', 'text-xs fill-blue-600 font-medium')
      .text('Prévisions');

    const forecastDots = g.selectAll('.forecast-dot')
      .data(forecast.forecasts)
      .enter()
      .append('circle')
      .attr('class', 'forecast-dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.realistic))
      .attr('r', 0)
      .attr('fill', CHART_COLORS.info)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6);

        const html = `
          <div class="font-semibold mb-2">${formatDate(d.date)}</div>
          <div class="space-y-1">
            <div class="flex justify-between gap-4">
              <span class="text-green-600">Optimiste:</span>
              <span class="font-medium">${formatCurrency(d.optimistic)}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-blue-600">● Réaliste:</span>
              <span class="font-medium">${formatCurrency(d.realistic)}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-orange-600">Pessimiste:</span>
              <span class="font-medium">${formatCurrency(d.pessimistic)}</span>
            </div>
            <div class="flex justify-between gap-4 pt-1 border-t">
              <span>Confiance:</span>
              <span class="font-bold">${formatPercentage(d.confidence * 100)}</span>
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
          .attr('r', 4);
        hideTooltip(tooltip);
      });

    forecastDots
      .transition(animateTransition())
      .delay((d, i) => i * 50 + 700)
      .attr('r', 4);

    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 200}, 20)`);

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 30)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', CHART_COLORS.primary)
      .attr('stroke-width', 3);

    legend.append('text')
      .attr('x', 40)
      .attr('y', 5)
      .attr('class', 'text-sm fill-gray-700')
      .text('Historique');

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 30)
      .attr('y1', 25)
      .attr('y2', 25)
      .attr('stroke', CHART_COLORS.info)
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '8,4');

    legend.append('text')
      .attr('x', 40)
      .attr('y', 30)
      .attr('class', 'text-sm fill-gray-700')
      .text('Prévision');

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 40)
      .attr('width', 30)
      .attr('height', 10)
      .attr('fill', CHART_COLORS.info)
      .attr('opacity', 0.3);

    legend.append('text')
      .attr('x', 40)
      .attr('y', 50)
      .attr('class', 'text-sm fill-gray-700')
      .text('Intervalle');

    return () => {
      tooltip.remove();
    };
  }, [forecast, width, height]);

  if (forecast.forecasts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        Données insuffisantes pour générer des prévisions
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="overflow-visible" />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Tendance</p>
          <p className="text-lg font-bold text-gray-900">
            {forecast.trend === 'increasing' ? '📈 Croissante' :
             forecast.trend === 'decreasing' ? '📉 Décroissante' :
             '➡️ Stable'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Précision</p>
          <p className="text-lg font-bold text-gray-900">{formatPercentage(forecast.accuracy)}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Pattern Saisonnier</p>
          <p className="text-lg font-bold text-gray-900">
            {forecast.seasonalPattern ? '✓ Détecté' : '○ Non détecté'}
          </p>
        </div>
      </div>
    </div>
  );
}
