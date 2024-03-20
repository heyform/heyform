import { geoMercator, geoPath } from 'd3-geo'
import { Feature } from 'geojson'
import { FC, ReactNode, createRef } from 'react'

import { PathTooltip } from './PathTooltip'
import { Region } from './Region'
import geoData from './countries'

interface WorldMapCountry {
  code: string
  color: string
}

interface WorldMapProps {
  width: number
  height: number
  textColor?: string
  backgroundColor?: string
  data: WorldMapCountry[]
}

export const WorldMap: FC<WorldMapProps> = ({
  width,
  height,
  textColor = '#fff',
  backgroundColor = '#1d1d1d',
  data
}) => {
  const svgRef = createRef<SVGSVGElement>()

  const projection = geoMercator()
  const pathGenerator = geoPath().projection(projection)

  const regionPaths: ReactNode[] = []
  const regionTooltips: ReactNode[] = []

  geoData.forEach(({ isoCode, countryName, coordinates }) => {
    const triggerRef = createRef<SVGPathElement>()
    const country = data.find(country => country.code === isoCode.toLowerCase())

    const geoFeature: Feature = {
      type: 'Feature',
      properties: { NAME: countryName, ISO_A2: isoCode },
      geometry: {
        type: 'MultiPolygon',
        coordinates
      }
    }

    const path = (
      <Region
        ref={triggerRef}
        d={pathGenerator(geoFeature)!}
        style={{
          fill: country?.color ?? '#f3f3f3',
          cursor: 'pointer'
        }}
        key={`path_region_${isoCode}`}
      />
    )

    const tooltip = country ? (
      <PathTooltip
        key={`path_tooltip_${isoCode}`}
        text={countryName}
        pathRef={triggerRef}
        svgRef={svgRef}
        textColor={textColor}
        backgroundColor={backgroundColor}
      />
    ) : null

    regionPaths.push(path)
    regionTooltips.push(tooltip)
  })

  return (
    <figure className="world-map">
      <svg ref={svgRef} height={`${height}px`} width={`${width}px`}>
        <g transform={`translate(0, 0) scale(${width / 960}) translate(0, 200)`}>{regionPaths}</g>
        {regionTooltips}
      </svg>
    </figure>
  )
}
