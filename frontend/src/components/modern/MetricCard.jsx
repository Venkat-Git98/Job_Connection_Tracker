import React from 'react'
import { Link } from 'react-router-dom'

const MetricCard = ({ 
  id, 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color, 
  link, 
  animationDelay = 0 
}) => {
  const getTrendIcon = () => {
    if (trend > 0) return '↗'
    if (trend < 0) return '↘'
    return '→'
  }

  const getTrendClass = () => {
    if (trend > 0) return 'positive'
    if (trend < 0) return 'negative'
    return 'neutral'
  }

  const CardContent = () => (
    <>
      <div className="metric-icon" style={{ background: color }}>
        {icon}
      </div>
      <div className="metric-content">
        <div className="metric-value" style={{ background: color }}>
          {value}
        </div>
        <div className="metric-title">{title}</div>
        <div className="metric-subtitle">{subtitle}</div>
        {trend !== undefined && (
          <div className={`metric-trend ${getTrendClass()}`}>
            <span className="trend-icon">{getTrendIcon()}</span>
            <span className="trend-value">{Math.abs(trend)}%</span>
            <span className="trend-label">vs last period</span>
          </div>
        )}
      </div>
      <div className="metric-arrow">→</div>
    </>
  )

  const cardProps = {
    className: `metric-card animate-slide-in-up`,
    style: { animationDelay: `${animationDelay}s` }
  }

  if (link) {
    return (
      <Link to={link} {...cardProps}>
        <CardContent />
        <style jsx>{`
          .metric-card {
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--border-primary);
            border-radius: var(--radius-3xl);
            padding: var(--space-8);
            text-decoration: none;
            color: inherit;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            min-height: 240px;
            position: relative;
            overflow: hidden;
            transition: var(--transition-normal);
            cursor: pointer;
          }

          .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: ${color};
            opacity: 0;
            transition: opacity var(--transition-normal);
          }

          .metric-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: var(--shadow-2xl);
            border-color: var(--border-accent);
            text-decoration: none;
            color: inherit;
          }

          .metric-card:hover::before {
            opacity: 0.05;
          }

          .metric-card:hover .metric-arrow {
            transform: translateX(4px);
            opacity: 1;
          }

          .metric-icon {
            width: 80px;
            height: 80px;
            border-radius: var(--radius-2xl);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            margin-bottom: var(--space-6);
            position: relative;
            z-index: 1;
            box-shadow: var(--shadow-lg);
          }

          .metric-content {
            position: relative;
            z-index: 1;
            width: 100%;
          }

          .metric-value {
            font-size: var(--text-4xl);
            font-weight: 900;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: var(--space-3);
            line-height: 1;
            letter-spacing: var(--tracking-tighter);
          }

          .metric-title {
            font-size: var(--text-lg);
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: var(--space-2);
          }

          .metric-subtitle {
            font-size: var(--text-sm);
            color: var(--text-muted);
            margin-bottom: var(--space-4);
            line-height: var(--leading-relaxed);
          }

          .metric-trend {
            display: inline-flex;
            align-items: center;
            gap: var(--space-1);
            padding: var(--space-2) var(--space-3);
            border-radius: var(--radius-full);
            font-size: var(--text-xs);
            font-weight: 700;
            position: relative;
            z-index: 1;
          }

          .metric-trend.positive {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success-500);
            border: 1px solid rgba(16, 185, 129, 0.2);
          }

          .metric-trend.negative {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger-500);
            border: 1px solid rgba(239, 68, 68, 0.2);
          }

          .metric-trend.neutral {
            background: rgba(107, 114, 128, 0.1);
            color: var(--neutral-500);
            border: 1px solid rgba(107, 114, 128, 0.2);
          }

          .trend-icon {
            font-size: var(--text-sm);
          }

          .trend-value {
            font-weight: 800;
          }

          .trend-label {
            opacity: 0.8;
          }

          .metric-arrow {
            position: absolute;
            top: var(--space-4);
            right: var(--space-4);
            font-size: var(--text-xl);
            color: var(--text-muted);
            opacity: 0;
            transition: var(--transition-normal);
            z-index: 1;
          }

          @media (max-width: 768px) {
            .metric-card {
              min-height: 200px;
              padding: var(--space-6);
            }

            .metric-icon {
              width: 60px;
              height: 60px;
              font-size: 2rem;
              margin-bottom: var(--space-4);
            }

            .metric-value {
              font-size: var(--text-3xl);
            }

            .metric-title {
              font-size: var(--text-base);
            }
          }
        `}</style>
      </Link>
    )
  }

  return (
    <div {...cardProps}>
      <CardContent />
      <style jsx>{`
        .metric-card {
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-3xl);
          padding: var(--space-8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 240px;
          position: relative;
          overflow: hidden;
          transition: var(--transition-normal);
        }

        .metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: ${color};
          opacity: 0;
          transition: opacity var(--transition-normal);
        }

        .metric-card:hover::before {
          opacity: 0.05;
        }

        .metric-icon {
          width: 80px;
          height: 80px;
          background: ${color};
          border-radius: var(--radius-2xl);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          margin-bottom: var(--space-6);
          position: relative;
          z-index: 1;
          box-shadow: var(--shadow-lg);
        }

        .metric-content {
          position: relative;
          z-index: 1;
          width: 100%;
        }

        .metric-value {
          font-size: var(--text-4xl);
          font-weight: 900;
          background: ${color};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--space-3);
          line-height: 1;
          letter-spacing: var(--tracking-tighter);
        }

        .metric-title {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .metric-subtitle {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin-bottom: var(--space-4);
          line-height: var(--leading-relaxed);
        }

        .metric-trend {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 700;
          position: relative;
          z-index: 1;
        }

        .metric-trend.positive {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success-500);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .metric-trend.negative {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger-500);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .metric-trend.neutral {
          background: rgba(107, 114, 128, 0.1);
          color: var(--neutral-500);
          border: 1px solid rgba(107, 114, 128, 0.2);
        }

        .trend-icon {
          font-size: var(--text-sm);
        }

        .trend-value {
          font-weight: 800;
        }

        .trend-label {
          opacity: 0.8;
        }

        .metric-arrow {
          display: none;
        }

        @media (max-width: 768px) {
          .metric-card {
            min-height: 200px;
            padding: var(--space-6);
          }

          .metric-icon {
            width: 60px;
            height: 60px;
            font-size: 2rem;
            margin-bottom: var(--space-4);
          }

          .metric-value {
            font-size: var(--text-3xl);
          }

          .metric-title {
            font-size: var(--text-base);
          }
        }
      `}</style>
    </div>
  )
}

export default MetricCard