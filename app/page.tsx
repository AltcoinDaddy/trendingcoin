"use client";
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface TrendingToken {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  price_btc: number;
  data: {
    current_price: number;
    price_change_percentage_24h: number;
    sparkline_in_7d: { price: number[] };
    market_cap: number;
    total_volume: number;
  };
}

interface SparklineDataPoint {
  price: number;
  index: number;
}

const TokenCard: React.FC<{ token: TrendingToken; onClick: () => void; onImageGenerate: () => void }> = ({ token, onClick, onImageGenerate }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      <div className="p-5">
        <div className="flex items-center mb-4">
          <img src={token.thumb} alt={token.name} className="w-12 h-12 rounded-full mr-4" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{token.name}</h2>
            <p className="text-gray-500">{token.symbol.toUpperCase()}</p>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-600">Rank: <span className="font-semibold">#{token.market_cap_rank}</span></p>
          <p className="text-lg font-bold text-gray-800">${token.data.current_price?.toFixed(2)}</p>
          <p className={`text-sm ${token.data.price_change_percentage_24h >= 0 ? "text-green-600" : "text-red-600"}`}>
            {token.data.price_change_percentage_24h >= 0 ? "▲" : "▼"} {Math.abs(token.data.price_change_percentage_24h)?.toFixed(2)}%
          </p>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={token.data.sparkline_in_7d?.price.map((price, index): SparklineDataPoint => ({ price, index }))}>
              <Line type="monotone" dataKey="price" stroke={token.data.price_change_percentage_24h >= 0 ? "#10B981" : "#EF4444"} strokeWidth={2} dot={false} />
              <XAxis dataKey="index" hide={true} />
              <YAxis hide={true} />
              <Tooltip 
                contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                labelStyle={{ color: '#374151' }}
                itemStyle={{ color: '#374151' }}
                formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
                labelFormatter={(label: number) => `Day ${label + 1}`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Market Cap: ${token.data.market_cap?.toLocaleString()}</p>
          <p>24h Volume: ${token.data.total_volume?.toLocaleString()}</p>
        </div>
        <div className="mt-4 flex justify-between">
          <button onClick={onClick} className="text-sm text-blue-500 hover:text-blue-700 transition-colors duration-200">
            View on CoinGecko →
          </button>
          <button onClick={onImageGenerate} className="text-sm bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded transition-colors duration-200">
            Download Image
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchTrendingTokens = useCallback(async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
      if (!response.ok) {
        throw new Error('Failed to fetch trending tokens');
      }
      const data = await response.json();

      const trendingIds = data.coins.map((coin: any) => coin.item.id).join(',');
      const priceResponse = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${trendingIds}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h`);
      if (!priceResponse.ok) {
        throw new Error('Failed to fetch token prices');
      }
      const priceData = await priceResponse.json();

      const tokens: TrendingToken[] = data.coins.map((coin: any) => {
        const priceInfo = priceData.find((price: any) => price.id === coin.item.id);
        return {
          ...coin.item,
          data: priceInfo || {},
        };
      });

      setTrendingTokens(tokens);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching trending tokens:', err);
      setError(`Error fetching data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrendingTokens();
  }, [fetchTrendingTokens]);

  const visitCoinGecko = useCallback((id: string) => {
    window.open(`https://www.coingecko.com/en/coins/${id}`, '_blank');
  }, []);

  const generateAndDownloadImage = useCallback((token: TrendingToken) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 630;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#8B5CF6');
    gradient.addColorStop(1, '#EC4899');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // White overlay for content
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.roundRect(40, 40, canvas.width - 80, canvas.height - 80, 20);
    ctx.fill();

    // Function to draw the rest of the image
    const drawRest = () => {
      // Token info
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(token.name, 180, 100);
      
      ctx.font = '36px Arial';
      ctx.fillText(`$${token.symbol}`, 180, 150);

      ctx.font = 'bold 64px Arial';
      ctx.fillText(`$${token.data.current_price?.toFixed(2)}`, 60, 240);

      ctx.fillStyle = token.data.price_change_percentage_24h >= 0 ? '#10B981' : '#EF4444';
      ctx.font = '36px Arial';
      ctx.fillText(`${token.data.price_change_percentage_24h >= 0 ? '▲' : '▼'} ${Math.abs(token.data.price_change_percentage_24h)?.toFixed(2)}%`, 60, 300);

      // Additional info
      ctx.fillStyle = '#4B5563';
      ctx.font = '24px Arial';
      ctx.fillText(`Market Cap: $${token.data.market_cap?.toLocaleString()}`, 60, 360);
      ctx.fillText(`24h Volume: $${token.data.total_volume?.toLocaleString()}`, 60, 400);
      ctx.fillText(`Rank: #${token.market_cap_rank}`, 60, 440);

      // Price chart
      const chartWidth = 1080;
      const chartHeight = 150;
      const chartData = token.data.sparkline_in_7d.price;
      const minPrice = Math.min(...chartData);
      const maxPrice = Math.max(...chartData);
      const priceRange = maxPrice - minPrice;

      ctx.strokeStyle = token.data.price_change_percentage_24h >= 0 ? '#10B981' : '#EF4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      chartData.forEach((price, index) => {
        const x = 60 + (index / (chartData.length - 1)) * chartWidth;
        const y = 580 - ((price - minPrice) / priceRange) * chartHeight;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Custom attribution
      ctx.fillStyle = '#9CA3AF';
      ctx.font = 'italic 18px Arial';
      ctx.fillText('made with love by @Altcoin_daddy', 60, 610);

      // Convert canvas to blob and trigger download
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${token.symbol}_info.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    // Token logo
    const logo = new Image();
    logo.crossOrigin = 'anonymous';  // This is crucial for CORS
    logo.onload = () => {
      ctx.drawImage(logo, 60, 60, 100, 100);
      drawRest();
    };
    logo.onerror = () => {
      console.error('Failed to load the token logo');
      // Draw a placeholder or just continue without the logo
      drawRest();
    };
    // Use a proxy to avoid CORS issues
    logo.src = `https://cors-anywhere.herokuapp.com/${token.thumb}`;
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        <div className="bg-white bg-opacity-80 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-7xl mx-auto">
        <div className="absolute inset-0 bg-white opacity-80 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative bg-white shadow-lg sm:rounded-3xl px-4 py-10 sm:p-20">
          <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-12">
            Trending Tokens on CoinGecko
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingTokens.map((token) => (
              <TokenCard 
                key={token.id} 
                token={token} 
                onClick={() => visitCoinGecko(token.id)}
                onImageGenerate={() => generateAndDownloadImage(token)}
              />
            ))}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default App;