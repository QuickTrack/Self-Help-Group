import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/lib/store/hooks';

export interface PrintTemplateProps {
  title: string;
  subtitle?: string;
  reportDate?: Date;
  version?: string;
  children: React.ReactNode;
  showExecutiveSummary?: boolean;
  executiveSummaryContent?: string;
  showFindings?: boolean;
  findingsContent?: React.ReactNode;
  showRecommendations?: boolean;
  recommendationsContent?: React.ReactNode;
  showAppendices?: boolean;
  appendicesContent?: React.ReactNode;
  charts?: Array<{ label: string; width: string; height: string }>;
  signatures?: Array<{ label: string; name: string }>;
  className?: string;
}

export default function PrintTemplate({
  title,
  subtitle,
  reportDate = new Date(),
  version = '1.0',
  children,
  showExecutiveSummary,
  executiveSummaryContent,
  showFindings,
  findingsContent,
  showRecommendations,
  recommendationsContent,
  showAppendices,
  appendicesContent,
  charts,
  signatures,
  className,
}: PrintTemplateProps) {
  const { settings: groupSettings } = useAppSelector(state => state.group);
  const groupName = groupSettings?.groupName || 'Self Help Group';
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePageCount = () => {
      if (contentRef.current) {
        const pages = Math.ceil(contentRef.current.scrollHeight / 1100);
        setTotalPages(Math.max(pages, 1));
      }
    };
    updatePageCount();
    window.addEventListener('resize', updatePageCount);
    return () => window.removeEventListener('resize', updatePageCount);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`print-template ${className}`}>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm 15mm 25mm 15mm;
          }
        }
      `}</style>
      
      <div className="no-print" style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button
          onClick={handlePrint}
          className="btn btn-primary"
        >
          Export to PDF / Print
        </button>
      </div>

      <div className="print-only print-header">
        <div className="print-header__logo">
          <span style={{ 
            width: '30px', 
            height: '30px', 
            background: '#228B22', 
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '14px'
          }}>
            G
          </span>
          <span className="print-header__logo-text">{groupName.split(' ').slice(0, 2).join(' ')}</span>
        </div>
        <div className="print-header__title">{title}</div>
      </div>

      <div ref={contentRef} className="print-content">
        <div className="print-title">{title}</div>
        {subtitle && <div className="print-subtitle">{subtitle}</div>}
        <div className="print-meta">
          Report Date: {formatDate(reportDate)} | Version {version}
        </div>

        <div className="print-document-info">
          <div className="print-document-info__item">
            <span className="print-document-info__label">Document Type</span>
            <span className="print-document-info__value">Corporate Report</span>
          </div>
          <div className="print-document-info__item">
            <span className="print-document-info__label">Classification</span>
            <span className="print-document-info__value" style={{ color: '#DC2626' }}>Internal Use Only</span>
          </div>
          <div className="print-document-info__item">
            <span className="print-document-info__label">Prepared By</span>
            <span className="print-document-info__value">System Administrator</span>
          </div>
        </div>

        {showExecutiveSummary && (
          <section className="print-section print-section--executive-summary">
            <h1 className="print-heading-1">Executive Summary</h1>
            <p>{executiveSummaryContent}</p>
          </section>
        )}

        <section className="print-section print-section--introduction">
          <h1 className="print-heading-1">Introduction</h1>
          <p>This report provides a comprehensive overview of the organization's welfare fund status. It includes financial metrics, key performance indicators, and strategic recommendations for fund management.</p>
        </section>

        <section className="print-section">
          {children}
        </section>

        {showFindings && (
          <section className="print-section print-section--findings">
            <h1 className="print-heading-1">Findings</h1>
            {findingsContent}
          </section>
        )}

        {showRecommendations && (
          <section className="print-section print-section--recommendations">
            <h1 className="print-heading-1">Recommendations</h1>
            {recommendationsContent}
          </section>
        )}

        {(charts || []).map((chart, index) => (
          <div key={index} className="print-chart-placeholder print-keep-together">
            <div className="print-chart-placeholder__label">{chart.label}</div>
            <div className="print-chart-placeholder__dimensions">
              Dimensions: {chart.width} × {chart.height}px
            </div>
          </div>
        ))}

        {(signatures || []).length > 0 && (
          <section className="print-signature-block">
            <h1 className="print-heading-1">Approvals</h1>
            <div className="print-signature-block__lines">
              {(signatures || []).map((sig, index) => (
                <div key={index} className="print-signature-block__line">
                  <div className="print-signature-block__name">{sig.name}</div>
                  <div className="print-signature-block__label">{sig.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {showAppendices && (
          <section className="print-section print-section--appendices">
            <h1 className="print-heading-1">Appendices</h1>
            {appendicesContent}
          </section>
        )}
      </div>

      <div className="print-only print-footer">
        <div className="print-footer__confidential">
          CONFIDENTIAL - Internal Use Only
        </div>
        <div className="print-footer__version">
          Version {version}
        </div>
        <div className="print-page-number">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    </div>
  );
}