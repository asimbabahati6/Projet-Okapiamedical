import * as d3 from 'd3';

export const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  gray: '#6B7280',
  gradient: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'],
};

export const CHART_MARGINS = {
  top: 20,
  right: 30,
  bottom: 40,
  left: 50,
};

export function createSvg(
  container: HTMLElement,
  width: number,
  height: number,
  margins = CHART_MARGINS
) {
  d3.select(container).selectAll('*').remove();

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'chart-svg');

  const g = svg
    .append('g')
    .attr('transform', `translate(${margins.left},${margins.top})`);

  const chartWidth = width - margins.left - margins.right;
  const chartHeight = height - margins.top - margins.bottom;

  return { svg, g, chartWidth, chartHeight };
}

export function createTooltip(container: HTMLElement) {
  return d3
    .select(container)
    .append('div')
    .attr('class', 'absolute hidden bg-gray-900 text-white text-sm px-3 py-2 rounded shadow-lg pointer-events-none z-50')
    .style('opacity', 0);
}

export function showTooltip(
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
  html: string,
  event: MouseEvent
) {
  tooltip
    .html(html)
    .classed('hidden', false)
    .style('opacity', 1)
    .style('left', `${event.pageX + 10}px`)
    .style('top', `${event.pageY - 10}px`);
}

export function hideTooltip(
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>
) {
  tooltip
    .classed('hidden', true)
    .style('opacity', 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit'
  }).format(date);
}

export function getColorScale(domain: string[], type: 'categorical' | 'sequential' = 'categorical') {
  if (type === 'categorical') {
    return d3.scaleOrdinal<string>()
      .domain(domain)
      .range(CHART_COLORS.gradient);
  }
  return d3.scaleSequential()
    .domain([0, domain.length - 1])
    .interpolator(d3.interpolateBlues);
}

export function addGridLines(
  g: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  chartWidth: number,
  chartHeight: number
) {
  g.append('g')
    .attr('class', 'grid')
    .attr('opacity', 0.1)
    .call(
      d3.axisLeft(yScale)
        .tickSize(-chartWidth)
        .tickFormat(() => '')
    );

  g.append('g')
    .attr('class', 'grid')
    .attr('opacity', 0.1)
    .attr('transform', `translate(0,${chartHeight})`)
    .call(
      d3.axisBottom(xScale)
        .tickSize(-chartHeight)
        .tickFormat(() => '')
    );
}

export function animateTransition(duration = 750) {
  return d3.transition()
    .duration(duration)
    .ease(d3.easeCubicInOut);
}

export function wrapText(
  text: d3.Selection<SVGTextElement, any, any, any>,
  width: number
) {
  text.each(function() {
    const text = d3.select(this);
    const words = text.text().split(/\s+/).reverse();
    let word;
    let line: string[] = [];
    let lineNumber = 0;
    const lineHeight = 1.1;
    const y = text.attr('y');
    const dy = parseFloat(text.attr('dy') || 0);
    let tspan = text.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');

    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(' '));
      if (tspan.node()!.getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = text.append('tspan')
          .attr('x', 0)
          .attr('y', y)
          .attr('dy', ++lineNumber * lineHeight + dy + 'em')
          .text(word);
      }
    }
  });
}

export function addLegend(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
  items: Array<{ label: string; color: string }>,
  x: number,
  y: number
) {
  const legend = svg
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${x},${y})`);

  const legendItems = legend
    .selectAll('.legend-item')
    .data(items)
    .enter()
    .append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0,${i * 20})`);

  legendItems
    .append('rect')
    .attr('width', 12)
    .attr('height', 12)
    .attr('fill', d => d.color)
    .attr('rx', 2);

  legendItems
    .append('text')
    .attr('x', 18)
    .attr('y', 10)
    .attr('class', 'text-sm fill-gray-700')
    .text(d => d.label);

  return legend;
}

export function addAxisLabels(
  g: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  xLabel: string,
  yLabel: string,
  chartWidth: number,
  chartHeight: number
) {
  g.append('text')
    .attr('class', 'text-sm fill-gray-600 font-medium')
    .attr('text-anchor', 'middle')
    .attr('x', chartWidth / 2)
    .attr('y', chartHeight + 35)
    .text(xLabel);

  g.append('text')
    .attr('class', 'text-sm fill-gray-600 font-medium')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('x', -chartHeight / 2)
    .attr('y', -40)
    .text(yLabel);
}

export function highlightOnHover(
  selection: d3.Selection<any, any, any, any>,
  highlightClass = 'opacity-100',
  normalClass = 'opacity-70'
) {
  selection
    .on('mouseenter', function() {
      d3.select(this).classed(normalClass, false).classed(highlightClass, true);
    })
    .on('mouseleave', function() {
      d3.select(this).classed(highlightClass, false).classed(normalClass, true);
    });
}
