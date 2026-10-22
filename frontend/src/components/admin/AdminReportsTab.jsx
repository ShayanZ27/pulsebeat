import React, { useState } from 'react';
import {
  Flag,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  ExternalLink,
  Music2,
  Disc,
  User,
  AlertTriangle,
  ChevronDown,
  MessageSquare,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useGetAdminReportsQuery,
  useResolveAdminReportMutation,
  useAdminHideContentMutation,
  useAdminSuspendUserMutation,
} from '../../store/api';
import { playSingleTrack } from '../../store/playerSlice';
import { getDisplayName, formatTime } from '../../utils/format';
import { showToast } from '../../utils/toast';

export default function AdminReportsTab({ accentColor, accentTextColor }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeSubTab, setActiveSubTab] = useState('pending'); // 'pending' | 'history'
  const [contentTypeFilter, setContentTypeFilter] = useState('all'); // 'all' | 'Music' | 'Album' | 'User'

  // Query: for 'pending', status='open'; for 'history', status='all' (filter locally for non-pending)
  const { data: reports = [], isLoading, refetch } = useGetAdminReportsQuery({
    status: activeSubTab === 'pending' ? 'open' : 'all',
    type: contentTypeFilter,
  });

  const [resolveAdminReport, { isLoading: resolving }] = useResolveAdminReportMutation();
  const [adminHideContent] = useAdminHideContentMutation();
  const [adminSuspendUser] = useAdminSuspendUserMutation();

  // Filter reports: if 'history', exclude 'pending'
  const displayReports = activeSubTab === 'pending'
    ? reports.filter((r) => r.status === 'pending')
    : reports.filter((r) => r.status !== 'pending');

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  const handleSuspendAndResolve = async (report) => {
    try {
      const contentId = report.reportedContent?._id || report.reportedContent;
      const contentType = report.contentType;

      if (contentType === 'User') {
        await adminSuspendUser(contentId).unwrap();
      } else {
        const type = contentType === 'Album' ? 'album' : 'music';
        await adminHideContent({ contentId, type }).unwrap();
      }

      await resolveAdminReport({
        reportId: report._id,
        status: 'resolved',
        comments: `Report resolved. ${contentType} has been suspended by administration.`,
      }).unwrap();

      showToast.success(`Suspended ${contentType} & resolved report`);
      refetch();
    } catch (err) {
      showToast.error(err?.data?.message || err?.message || 'Failed to process report');
    }
  };

  const handleDismiss = async (report) => {
    try {
      await resolveAdminReport({
        reportId: report._id,
        status: 'dismissed',
        comments: 'Report reviewed and dismissed. No violation found.',
      }).unwrap();

      showToast.success('Report dismissed');
      refetch();
    } catch (err) {
      showToast.error(err?.data?.message || err?.message || 'Failed to dismiss report');
    }
  };

  const getReasonColor = (reason) => {
    switch (reason) {
      case 'copyright':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'abusive':
      case 'inappropriate':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'spam':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-sidebar border border-brd shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-space font-bold uppercase tracking-wider text-txt-muted">
            <Flag size={14} style={{ color: accentColor }} />
            <span>Content Moderation</span>
          </div>
          <h2 className="text-xl md:text-2xl font-playfair font-black text-txt">
            Reports & Flags
          </h2>
          <p className="text-xs md:text-sm text-txt-sec">
            Review user-reported tracks, albums, and artist accounts. Take swift moderation actions to protect the platform.
          </p>
        </div>

        {/* Sub-Tabs: Pending vs History */}
        <div className="flex items-center gap-2 p-1 bg-elevated rounded-2xl border border-brd shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-space font-bold transition-all cursor-pointer ${
              activeSubTab === 'pending'
                ? 'shadow-sm'
                : 'text-txt-sec hover:text-txt'
            }`}
            style={activeSubTab === 'pending' ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
          >
            <AlertTriangle size={14} />
            <span>Pending Review</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-mono">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-space font-bold transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'shadow-sm'
                : 'text-txt-sec hover:text-txt'
            }`}
            style={activeSubTab === 'history' ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
          >
            <Clock size={14} />
            <span>Report History</span>
          </button>
        </div>
      </div>

      {/* Content Type Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-space font-bold uppercase tracking-wider text-txt-muted mr-1">
          Filter:
        </span>
        {[
          { id: 'all', label: 'All Items' },
          { id: 'Music', label: 'Tracks', icon: Music2 },
          { id: 'Album', label: 'Albums', icon: Disc },
          { id: 'User', label: 'Artists / Users', icon: User },
        ].map((type) => {
          const Icon = type.icon;
          const isActive = contentTypeFilter === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setContentTypeFilter(type.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-space font-bold border transition-all cursor-pointer ${
                isActive
                  ? 'bg-elevated border-primary text-txt'
                  : 'bg-sidebar border-brd text-txt-sec hover:text-txt hover:bg-elevated'
              }`}
              style={isActive ? { borderColor: accentColor, color: accentColor } : undefined}
            >
              {Icon && <Icon size={12} />}
              <span>{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 rounded-3xl bg-sidebar border border-brd/50 animate-pulse" />
            ))}
          </div>
        ) : displayReports.length === 0 ? (
          <div className="py-20 text-center p-8 rounded-3xl bg-sidebar border border-brd">
            <div className="w-16 h-16 rounded-3xl bg-elevated flex items-center justify-center mx-auto mb-4 text-emerald-400 border border-brd">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-lg font-bold text-txt mb-1">
              {activeSubTab === 'pending' ? 'All Clear! No Pending Reports' : 'No Report History Found'}
            </h3>
            <p className="text-xs text-txt-sec max-w-md mx-auto">
              {activeSubTab === 'pending'
                ? 'There are currently no outstanding user reports that require administrator review.'
                : 'Past resolved and dismissed reports will be cataloged here for audit history.'}
            </p>
          </div>
        ) : (
          displayReports.map((report) => {
            const reporter = report.reporter;
            const reporterName = reporter
              ? getDisplayName(reporter, reporter.username || 'User')
              : 'Anonymous';
            const reported = report.reportedContent || {};
            const isTargetSuspended = reported.isSuspended;

            return (
              <div
                key={report._id}
                className="p-6 rounded-3xl bg-sidebar border border-brd shadow-sm space-y-5 hover:border-brd/80 transition-all"
              >
                {/* Header: Reporter info & Status badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brd/60 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={reporter?.profilePicture || 'https://picsum.photos/seed/reporter/60/60'}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover bg-elevated border border-brd"
                    />
                    <div>
                      <p className="text-xs text-txt">
                        Reported by <span className="font-bold">{reporterName}</span>
                        {reporter?.email && (
                          <span className="text-txt-muted ml-1.5">({reporter.email})</span>
                        )}
                      </p>
                      <p className="text-[11px] text-txt-muted font-space">
                        {new Date(report.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-space font-bold uppercase tracking-wider border ${getReasonColor(
                        report.reason
                      )}`}
                    >
                      {report.reason}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-space font-bold uppercase tracking-wider border ${
                        report.status === 'pending'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : report.status === 'resolved'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-txt-muted/15 text-txt-muted border-txt-muted/30'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>

                {/* Main Body: Target Content Preview + Reporter Note */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reported Target Box */}
                  <div className="p-4 rounded-2xl bg-elevated/70 border border-brd/70 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-sidebar border border-brd shadow-xs">
                        <img
                          src={
                            reported.coverImage ||
                            reported.profilePicture ||
                            'https://picsum.photos/seed/content/100/100'
                          }
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-space font-bold uppercase tracking-wider text-txt-muted">
                          Reported {report.contentType}
                        </span>
                        <h4 className="text-sm font-bold text-txt truncate">
                          {reported.title || reported.username || 'Content Unavailable'}
                        </h4>
                        <p className="text-xs text-txt-sec truncate">
                          {reported.artist
                            ? getDisplayName(reported.artist, 'Artist')
                            : report.contentType === 'User'
                            ? reported.email || 'User Account'
                            : ''}
                        </p>
                      </div>
                    </div>

                    {/* Quick navigation / preview */}
                    <div className="shrink-0 flex items-center gap-2">
                      {report.contentType === 'Music' && reported.uri && (
                        <button
                          type="button"
                          onClick={() => dispatch(playSingleTrack(reported))}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-txt-sec hover:text-txt bg-sidebar border border-brd hover:bg-elevated transition-colors cursor-pointer"
                          title="Play Track"
                        >
                          <Play size={15} className="ml-0.5 fill-current" />
                        </button>
                      )}

                      {report.contentType === 'Album' && reported._id && (
                        <button
                          type="button"
                          onClick={() => navigate(`/album/${reported._id}`)}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-txt-sec hover:text-txt bg-sidebar border border-brd hover:bg-elevated transition-colors cursor-pointer"
                          title="Open Album"
                        >
                          <ExternalLink size={15} />
                        </button>
                      )}

                      {report.contentType === 'User' && reported._id && (
                        <button
                          type="button"
                          onClick={() => navigate(`/artist/${reported._id}`)}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-txt-sec hover:text-txt bg-sidebar border border-brd hover:bg-elevated transition-colors cursor-pointer"
                          title="Open Profile"
                        >
                          <ExternalLink size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reporter's Comments Box */}
                  <div className="p-4 rounded-2xl bg-elevated/70 border border-brd/70 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-space font-bold uppercase tracking-wider text-txt-muted mb-1.5">
                        <MessageSquare size={12} />
                        <span>Reporter Explanation</span>
                      </div>
                      <p className="text-xs text-txt leading-relaxed line-clamp-3 italic">
                        "{report.description || 'No additional comment provided by reporter.'}"
                      </p>
                    </div>

                    {isTargetSuspended && (
                      <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-space font-bold text-amber-400">
                        <ShieldAlert size={12} /> Target is already suspended
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions or Resolution Notes */}
                {report.status === 'pending' ? (
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={resolving}
                      onClick={() => handleDismiss(report)}
                      className="px-5 py-2.5 rounded-full text-xs font-space font-bold bg-sidebar hover:bg-elevated border border-brd text-txt-sec hover:text-txt transition-all cursor-pointer"
                    >
                      Dismiss Report
                    </button>

                    <button
                      type="button"
                      disabled={resolving}
                      onClick={() => handleSuspendAndResolve(report)}
                      className="px-5 py-2.5 rounded-full text-xs font-space font-bold bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                    >
                      <ShieldAlert size={14} /> Suspend & Resolve
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-txt-muted font-space border-t border-brd/40">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>
                        Action taken: <strong className="text-txt">{report.actionTaken || 'None specified'}</strong>
                      </span>
                    </div>

                    {report.reviewedBy && (
                      <span>
                        Reviewed by: <strong className="text-txt">{getDisplayName(report.reviewedBy, 'Admin')}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
