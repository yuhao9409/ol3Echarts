import * as React from 'react';
import { Map, View } from 'ol';
import { Tile as TileLayer } from 'ol/layer';
import { XYZ } from 'ol/source';
import EChartsLayer from 'ol-echarts';

interface PageProps {
  chart: any[];
}

interface PageState {
  zoom: number;
  rotation: number;
  center: number[];
}

const CHUNK_COUNT = 10;

class Index extends React.Component<PageProps, PageState> {
  private map: any | null;

  private chart: any | null;

  private container: React.RefObject<HTMLDivElement>;

  constructor(props: PageProps, context: any) {
    super(props, context);
    this.state = {
      zoom: 10,
      rotation: 0,
      center: [-74.04327099998152, 40.86737600240287],
    };

    this.container = React.createRef();
    this.map = null;
  }

  componentDidMount() {
    if (this.container.current) {
      this.map = new Map({
        target: this.container.current,
        view: new View({
          ...this.state,
          projection: 'EPSG:4326',
        }),
        layers: [
          new TileLayer({
            source: new XYZ({
              url: 'http://cache1.arcgisonline.cn/arcgis/rest/services/ChinaOnline'
                + 'StreetPurplishBlue/MapServer/tile/{z}/{y}/{x}',
            }),
          }),
        ],
      });

      this.chart = new EChartsLayer({
        progressive: 20000,
        backgroundColor: 'transparent',
        series: [{
          type: 'lines',
          blendMode: 'lighter',
          dimensions: ['value'],
          data: new Float64Array(),
          polyline: true,
          large: true,
          lineStyle: {
            color: 'orange',
            width: 0.5,
            opacity: 0.3,
          },
        }],
      }, {
        hideOnMoving: true,
        hideOnZooming: true,
      });

      this.chart.appendTo(this.map);

      this.fetchData(0);
    }
  }

  fetchData(idx: number) {
    if (idx >= CHUNK_COUNT) {
      return;
    }
    const dataURL = `./static/examples/incremental/data/links_ny_${idx}.bin`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', dataURL, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      const rawData = new Float32Array(xhr.response);
      const data = new Float64Array(rawData.length - 2);
      const offsetX = rawData[0];
      const offsetY = rawData[1];
      let off = 0;
      for (let i = 2; i < rawData.length;) {
        const count = rawData[i++];
        data[off++] = count;
        for (let k = 0; k < count; k++) {
          const x = rawData[i++] + offsetX;
          const y = rawData[i++] + offsetY;
          data[off++] = x;
          data[off++] = y;
        }
      }
      this.chart.appendData({
        seriesIndex: 0,
        data,
      }, true);
      this.fetchData(idx + 1);
    };
    xhr.send();
  }

  render() {
    return (<div ref={this.container} className="map-content" />);
  }
}

export default Index;
