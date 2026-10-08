import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  ArrowDown,
  ArrowUp,
  Check,
  CheckSquare,
  KeyRound,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import "./Admin.css";

const ANALYTICS_RANGES = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "3M", value: 90 },
  { label: "6M", value: 180 },
  { label: "1Y", value: 365 },
];

function Admin() {
  const { user, loading, isAdmin } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [instagram, setInstagram] = useState(null);
  const [staff, setStaff] = useState([]);
  const [logs, setLogs] = useState([]);

  const [analyticsRange, setAnalyticsRange] = useState(7);

  const [loadingData, setLoadingData] = useState(true);
  const [refreshingInstagram, setRefreshingInstagram] =
    useState(false);

  const [error, setError] = useState("");

  const [showCreateEditor, setShowCreateEditor] =
    useState(false);

  const [showResetPassword, setShowResetPassword] =
    useState(null);

  const [actionLoading, setActionLoading] = useState(null);

  const [editorForm, setEditorForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [resetPassword, setResetPassword] = useState("");

  /* ==============================
     AUDIT LOG SELECTION
  ============================== */

  const [selectedLogIds, setSelectedLogIds] = useState([]);
  const [selectingLogs, setSelectingLogs] = useState(false);
  const [deletingLogs, setDeletingLogs] = useState(false);

  const logPressTimer = useRef(null);

  /* ==============================
     REDIRECT
  ============================== */

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      window.location.replace("/");
    }
  }, [loading, user, isAdmin]);

  /* ==============================
     FETCH DASHBOARD DATA
  ============================== */

  async function fetchDashboardData() {
    if (!isAdmin) {
      return;
    }

    setLoadingData(true);
    setError("");

    try {
      const [
        analyticsResponse,
        instagramResponse,
        staffResponse,
        logsResponse,
      ] = await Promise.all([
        fetch(
          `/api/admin/analytics?range=${analyticsRange}`,
          {
            credentials: "include",
          }
        ),

        fetch("/api/instagram/stats", {
          credentials: "include",
        }),

        fetch("/api/staff", {
          credentials: "include",
        }),

        fetch("/api/audit-logs", {
          credentials: "include",
        }),
      ]);

      const [
        analyticsData,
        instagramData,
        staffData,
        logsData,
      ] = await Promise.all([
        analyticsResponse.json(),
        instagramResponse.json(),
        staffResponse.json(),
        logsResponse.json(),
      ]);

      if (!analyticsResponse.ok) {
        throw new Error(
          analyticsData.error ||
            "Unable to load analytics."
        );
      }

      if (!instagramResponse.ok) {
        throw new Error(
          instagramData.error ||
            "Unable to load Instagram statistics."
        );
      }

      if (!staffResponse.ok) {
        throw new Error(
          staffData.error ||
            "Unable to load staff."
        );
      }

      if (!logsResponse.ok) {
        throw new Error(
          logsData.error ||
            "Unable to load audit logs."
        );
      }

      setAnalytics(analyticsData);
      setInstagram(instagramData);
      setStaff(staffData.staff || []);
      setLogs(logsData.logs || []);

      // Remove selections that no longer exist.
      setSelectedLogIds((current) =>
        current.filter((id) =>
          (logsData.logs || []).some(
            (log) => Number(log.id) === Number(id)
          )
        )
      );
    } catch (err) {
      console.error(
        "Failed to load admin dashboard:",
        err
      );

      setError(
        err.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchDashboardData();
    }
  }, [loading, isAdmin, analyticsRange]);

  /* ==============================
     INSTAGRAM REFRESH
  ============================== */

  async function handleInstagramRefresh() {
    if (refreshingInstagram) {
      return;
    }

    setRefreshingInstagram(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/instagram/refresh",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to refresh Instagram statistics."
        );
      }

      setInstagram(data.stats);
    } catch (err) {
      console.error(
        "Instagram refresh failed:",
        err
      );

      setError(
        err.message ||
          "Unable to refresh Instagram statistics."
      );
    } finally {
      setRefreshingInstagram(false);
    }
  }

  /* ==============================
     STAFF ROLE CHANGE
  ============================== */

  async function handleRoleChange(member) {
    if (actionLoading) {
      return;
    }

    const newRole =
      member.role === "admin"
        ? "editor"
        : "admin";

    const confirmed = window.confirm(
      `Change ${member.name}'s role to ${newRole}?`
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(`role-${member.id}`);
    setError("");

    try {
      const response = await fetch(
        `/api/staff/${member.id}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to change staff role."
        );
      }

      await fetchDashboardData();
    } catch (err) {
      console.error(
        "Role change failed:",
        err
      );

      setError(
        err.message ||
          "Unable to change staff role."
      );
    } finally {
      setActionLoading(null);
    }
  }

  /* ==============================
     CREATE EDITOR
  ============================== */

  async function handleCreateEditor(event) {
    event.preventDefault();

    if (actionLoading) {
      return;
    }

    setActionLoading("create-editor");
    setError("");

    try {
      const response = await fetch(
        "/api/staff",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: editorForm.name.trim(),
            email: editorForm.email.trim(),
            password: editorForm.password,
            role: "editor",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create editor."
        );
      }

      setEditorForm({
        name: "",
        email: "",
        password: "",
      });

      setShowCreateEditor(false);

      await fetchDashboardData();
    } catch (err) {
      console.error(
        "Create editor failed:",
        err
      );

      setError(
        err.message ||
          "Unable to create editor."
      );
    } finally {
      setActionLoading(null);
    }
  }

  /* ==============================
     RESET PASSWORD
  ============================== */

  async function handleResetPassword(event) {
    event.preventDefault();

    if (!showResetPassword || actionLoading) {
      return;
    }

    setActionLoading(
      `reset-${showResetPassword.id}`
    );

    setError("");

    try {
      const response = await fetch(
        `/api/staff/${showResetPassword.id}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            password: resetPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to reset password."
        );
      }

      setResetPassword("");
      setShowResetPassword(null);

      await fetchDashboardData();
    } catch (err) {
      console.error(
        "Reset password failed:",
        err
      );

      setError(
        err.message ||
          "Unable to reset password."
      );
    } finally {
      setActionLoading(null);
    }
  }

  /* ==============================
          DELETE EDITOR
  ============================== */

  const handleDeleteStaff = async (staffMember) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${staffMember.name}'s account?\n\n` +
        `This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(`delete-${staffMember.id}`);
    setError("");

    try {
      const response = await fetch(
        `/api/staff/${staffMember.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete staff account"
        );
      }

      /*
       * Refresh the dashboard so the deleted
       * account disappears immediately.
       */
      await fetchDashboardData();

    } catch (error) {
      console.error(
        "Delete staff error:",
        error
      );

      setError(
        error.message ||
          "Failed to delete staff account"
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* ==============================
     AUDIT LOG SELECTION
  ============================== */

  function startLogSelection(logId) {
    setSelectingLogs(true);

    setSelectedLogIds((current) => {
      if (current.includes(logId)) {
        return current;
      }

      return [...current, logId];
    });
  }

  function toggleLogSelection(logId) {
    setSelectedLogIds((current) => {
      if (current.includes(logId)) {
        return current.filter(
          (id) => id !== logId
        );
      }

      return [...current, logId];
    });
  }

  function handleLogPointerDown(logId) {
    if (selectingLogs) {
      return;
    }

    clearLogPressTimer();

    logPressTimer.current = setTimeout(() => {
      startLogSelection(logId);
    }, 600);
  }

  function handleLogPointerUp() {
    clearLogPressTimer();
  }

  function handleLogPointerLeave() {
    clearLogPressTimer();
  }

  function clearLogPressTimer() {
    if (logPressTimer.current) {
      clearTimeout(logPressTimer.current);
      logPressTimer.current = null;
    }
  }

  function handleLogContextMenu(event) {
    if (selectingLogs) {
      event.preventDefault();
    }
  }

  function handleLogClick(logId) {
    if (!selectingLogs) {
      return;
    }

    toggleLogSelection(logId);
  }

  function handleSelectAllLogs() {
    if (selectedLogIds.length === logs.length) {
      setSelectedLogIds([]);
      return;
    }

    setSelectedLogIds(
      logs.map((log) => Number(log.id))
    );
  }

  function cancelLogSelection() {
    clearLogPressTimer();
    setSelectingLogs(false);
    setSelectedLogIds([]);
  }

  async function handleDeleteSelectedLogs() {
    if (
      deletingLogs ||
      selectedLogIds.length === 0
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedLogIds.length} selected audit ${
        selectedLogIds.length === 1
          ? "log"
          : "logs"
      }?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingLogs(true);
    setError("");

    try {
      const response = await fetch(
        "/api/audit-logs",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ids: selectedLogIds,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to delete audit logs."
        );
      }

      cancelLogSelection();

      await fetchDashboardData();
    } catch (err) {
      console.error(
        "Delete audit logs failed:",
        err
      );

      setError(
        err.message ||
          "Unable to delete audit logs."
      );
    } finally {
      setDeletingLogs(false);
    }
  }

  const allLogsSelected =
    logs.length > 0 &&
    selectedLogIds.length === logs.length;

  /* ==============================
     STAFF COUNTS
  ============================== */

  const administrators = useMemo(
    () =>
      staff.filter(
        (member) => member.role === "admin"
      ),
    [staff]
  );

  const editors = useMemo(
    () =>
      staff.filter(
        (member) => member.role === "editor"
      ),
    [staff]
  );

  /* ==============================
     GRAPH DATA
  ============================== */

  const graphData = useMemo(() => {
    if (!analytics?.daily) {
      return [];
    }

    const values = new Map(
      analytics.daily.map((item) => [
        item.date,
        Number(item.visits) || 0,
      ])
    );

    const result = [];

    for (
      let i = analyticsRange - 1;
      i >= 0;
      i--
    ) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);

      date.setDate(
        date.getDate() - i
      );

      const key = date
        .toISOString()
        .slice(0, 10);

      result.push({
        date: key,
        visits: values.get(key) || 0,
      });
    }

    return result;
  }, [analytics, analyticsRange]);

  const maxGraphValue = Math.max(
    ...graphData.map(
      (item) => item.visits
    ),
    1
  );

  /* ==============================
     FORMATTERS
  ============================== */

  function formatNumber(value) {
    return new Intl.NumberFormat(
      "en-IN"
    ).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const normalizedValue =
      typeof value === "string" &&
      !value.endsWith("Z") &&
      !/[+-]\d{2}:\d{2}$/.test(value)
        ? `${value.replace(" ", "T")}Z`
        : value;

    return new Date(normalizedValue).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  function formatLogDetails(details) {
    if (!details) {
      return "—";
    }

    try {
      const parsed =
        typeof details === "string"
          ? JSON.parse(details)
          : details;

      return Object.entries(parsed)
        .map(
          ([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(", ")}`;
            }

            if (
              value !== null &&
              typeof value === "object"
            ) {
              return `${key}: ${JSON.stringify(value)}`;
            }

            return `${key}: ${value}`;
          }
        )
        .join(" · ");
    } catch {
      return String(details);
    }
  }

  /* ==============================
     LOADING
  ============================== */

  if (
    loading ||
    !user ||
    !isAdmin
  ) {
    return (
      <main className="admin-page">
        <div className="admin-loading">
          Loading dashboard...
        </div>
      </main>
    );
  }

  /* ==============================
     UI
  ============================== */

  return (
    <main className="admin-page">
      <div className="admin-container">

        {/* ============================
            HEADER
        ============================ */}

        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">
              Administration
            </p>

            <h1>
              Admin Dashboard
            </h1>

            <p className="admin-welcome">
              Welcome, {user.name}
            </p>
          </div>

          <button
            type="button"
            className="admin-back-button"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            ← Back to T&amp;P
          </button>
        </header>

        {error && (
          <div className="admin-error">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {loadingData ? (
          <div className="admin-loading-card">
            Loading dashboard data...
          </div>
        ) : (
          <>
            {/* ============================
                WEBSITE ANALYTICS
            ============================ */}

            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <p className="admin-section-eyebrow">
                    Website
                  </p>

                  <h2>
                    Analytics
                  </h2>
                </div>

                <Activity size={22} />
              </div>

              <div className="admin-stat-grid">

                <article className="admin-stat-card">
                  <span>
                    Today
                  </span>

                  <strong>
                    {formatNumber(
                      analytics?.stats?.today
                    )}
                  </strong>

                  <small>
                    visits
                  </small>
                </article>

                <article className="admin-stat-card">
                  <span>
                    This Week
                  </span>

                  <strong>
                    {formatNumber(
                      analytics?.stats?.week
                    )}
                  </strong>

                  <small>
                    visits
                  </small>
                </article>

                <article className="admin-stat-card">
                  <span>
                    This Month
                  </span>

                  <strong>
                    {formatNumber(
                      analytics?.stats?.month
                    )}
                  </strong>

                  <small>
                    visits
                  </small>
                </article>

              </div>

              <div className="admin-chart-card">

                <div className="admin-chart-header">
                  <div>
                    <h3>
                      Traffic
                    </h3>

                    <p>
                      Website visits over time
                    </p>
                  </div>

                  <div className="admin-range-buttons">
                    {ANALYTICS_RANGES.map(
                      (range) => (
                        <button
                          key={range.value}
                          type="button"
                          className={
                            analyticsRange ===
                            range.value
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            setAnalyticsRange(
                              range.value
                            )
                          }
                        >
                          {range.label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="admin-chart">
                  {graphData.map(
                    (item) => {
                      const height =
                        (item.visits /
                          maxGraphValue) *
                        100;

                      return (
                        <div
                          className="admin-chart-bar"
                          key={item.date}
                          title={`${item.date}: ${item.visits} visits`}
                        >
                          <div
                            className="admin-chart-bar-fill"
                            style={{
                              height: `${Math.max(
                                height,
                                item.visits
                                  ? 4
                                  : 1
                              )}%`,
                            }}
                          />
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="admin-chart-labels">
                  <span>
                    {graphData[0]?.date ||
                      "—"}
                  </span>

                  <span>
                    {graphData[
                      graphData.length - 1
                    ]?.date || "—"}
                  </span>
                </div>

              </div>
            </section>

            {/* ============================
                INSTAGRAM
            ============================ */}

            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <p className="admin-section-eyebrow">
                    Social
                  </p>

                  <h2>
                    Instagram Statistics
                  </h2>
                </div>

                <Activity size={22} />
              </div>

              <div className="admin-stat-grid">

                <article className="admin-stat-card">
                  <span>
                    Followers
                  </span>

                  <strong>
                    {formatNumber(
                      instagram?.followers
                    )}
                  </strong>
                </article>

                <article className="admin-stat-card">
                  <span>
                    Likes
                  </span>

                  <strong>
                    {formatNumber(
                      instagram?.likes
                    )}
                  </strong>
                </article>

                <article className="admin-stat-card">
                  <span>
                    Views
                  </span>

                  <strong>
                    {formatNumber(
                      instagram?.views
                    )}
                  </strong>
                </article>

              </div>

              <div className="admin-instagram-footer">
                <div>
                  <span>
                    Last updated
                  </span>

                  <strong>
                    {formatDate(
                      instagram?.lastUpdated
                    )}
                  </strong>
                </div>

                <button
                  type="button"
                  className="admin-primary-button"
                  disabled={
                    refreshingInstagram
                  }
                  onClick={
                    handleInstagramRefresh
                  }
                >
                  <RefreshCw
                    size={17}
                    className={
                      refreshingInstagram
                        ? "admin-spin"
                        : ""
                    }
                  />

                  {refreshingInstagram
                    ? "Refreshing..."
                    : "Refresh Stats"}
                </button>
              </div>
            </section>

            {/* ============================
                STAFF MANAGEMENT
            ============================ */}

            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <p className="admin-section-eyebrow">
                    Access
                  </p>

                  <h2>
                    Staff Management
                  </h2>
                </div>

                <Users size={22} />
              </div>

              <div className="admin-staff-summary">

                <div>
                  <Shield size={18} />

                  <span>
                    Administrators
                  </span>

                  <strong>
                    {administrators.length}
                  </strong>
                </div>

                <div>
                  <Users size={18} />

                  <span>
                    Editors
                  </span>

                  <strong>
                    {editors.length}
                  </strong>
                </div>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() =>
                    setShowCreateEditor(true)
                  }
                >
                  <Plus size={17} />
                  Create Editor
                </button>

              </div>

              <div className="admin-staff-list">
                {staff.map((staffMember) => (
                  <article
                    key={staffMember.id}
                    className="admin-staff-row"
                  >
                    <div className="admin-staff-info">
                      <div className="admin-staff-avatar">
                        {staffMember.name?.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <strong>{staffMember.name}</strong>
                        <span>{staffMember.email}</span>
                      </div>
                    </div>

                    <div
                      className={`admin-role-badge ${staffMember.role}`}
                    >
                      {staffMember.role}
                    </div>

                    <div className="admin-staff-actions">
                      <button
                        type="button"
                        onClick={() => handleRoleChange(staffMember)}
                        disabled={actionLoading !== null}
                      >
                        {staffMember.role === "admin" ? (
                          <ArrowDown size={14} />
                        ) : (
                          <ArrowUp size={14} />
                        )}

                        {staffMember.role === "admin"
                          ? "Demote"
                          : "Promote"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setShowResetPassword(staffMember)
                        }
                        disabled={actionLoading !== null}
                      >
                        <KeyRound size={14} />
                        Reset Password
                      </button>

                      <button
                        type="button"
                        className="admin-danger-button"
                        onClick={() =>
                          handleDeleteStaff(staffMember)
                        }
                        disabled={
                          actionLoading ===
                          `delete-${staffMember.id}`
                        }
                      >
                        <Trash2 size={16} />

                        {actionLoading ===
                        `delete-${staffMember.id}`
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* ============================
                AUDIT LOGS
            ============================ */}

            <section className="admin-section">

              <div className="admin-section-heading">
                <div>
                  <p className="admin-section-eyebrow">
                    Security
                  </p>

                  <h2>
                    Audit Logs
                  </h2>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  {selectingLogs ? (
                    <>
                      <button
                        type="button"
                        className="admin-primary-button"
                        onClick={
                          handleSelectAllLogs
                        }
                        disabled={
                          logs.length === 0 ||
                          deletingLogs
                        }
                      >
                        <CheckSquare
                          size={17}
                        />

                        {allLogsSelected
                          ? "Deselect All"
                          : "Select All"}
                      </button>

                      <button
                        type="button"
                        className="admin-primary-button"
                        onClick={
                          handleDeleteSelectedLogs
                        }
                        disabled={
                          selectedLogIds.length ===
                            0 ||
                          deletingLogs
                        }
                      >
                        <Trash2
                          size={17}
                        />

                        {deletingLogs
                          ? "Deleting..."
                          : `Delete Selected${
                              selectedLogIds.length
                                ? ` (${selectedLogIds.length})`
                                : ""
                            }`}
                      </button>

                      <button
                        type="button"
                        className="admin-back-button"
                        onClick={
                          cancelLogSelection
                        }
                        disabled={
                          deletingLogs
                        }
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <span className="admin-log-count">
                      {logs.length} logs
                    </span>
                  )}
                </div>
              </div>

              {selectingLogs && (
                <div
                  style={{
                    marginBottom: "12px",
                    fontSize: "0.85rem",
                    opacity: 0.7,
                  }}
                >
                  {selectedLogIds.length} of{" "}
                  {logs.length} selected
                </div>
              )}

              {!selectingLogs && logs.length > 0 && (
                <div
                  style={{
                    marginBottom: "12px",
                    fontSize: "0.85rem",
                    opacity: 0.65,
                  }}
                >
                  Long-press a log to select logs
                  for deletion.
                </div>
              )}

              <div className="admin-log-table-wrapper">
                <table className="admin-log-table">

                  <thead>
                    <tr>
                      {selectingLogs && (
                        <th
                          style={{
                            width: "45px",
                          }}
                        >
                          #
                        </th>
                      )}

                      <th>
                        Time
                      </th>

                      <th>
                        User
                      </th>

                      <th>
                        Action
                      </th>

                      <th>
                        Entity
                      </th>

                      <th>
                        Details
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {logs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={
                            selectingLogs
                              ? 6
                              : 5
                          }
                          className="admin-empty"
                        >
                          No audit logs yet.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => {
                        const isSelected =
                          selectedLogIds.includes(
                            Number(log.id)
                          );

                        return (
                          <tr
                            key={log.id}
                            onPointerDown={() =>
                              handleLogPointerDown(
                                Number(log.id)
                              )
                            }
                            onPointerUp={
                              handleLogPointerUp
                            }
                            onPointerCancel={
                              handleLogPointerUp
                            }
                            onPointerLeave={
                              handleLogPointerLeave
                            }
                            onClick={() =>
                              handleLogClick(
                                Number(log.id)
                              )
                            }
                            onContextMenu={
                              handleLogContextMenu
                            }
                            style={{
                              cursor:
                                selectingLogs
                                  ? "pointer"
                                  : "default",

                              background:
                                isSelected
                                  ? "rgba(255, 255, 255, 0.06)"
                                  : undefined,
                            }}
                          >

                            {selectingLogs && (
                              <td>
                                <input
                                  type="checkbox"
                                  checked={
                                    isSelected
                                  }
                                  onChange={() =>
                                    toggleLogSelection(
                                      Number(
                                        log.id
                                      )
                                    )
                                  }
                                  onClick={(event) =>
                                    event.stopPropagation()
                                  }
                                />
                              </td>
                            )}

                            <td>
                              {formatDate(
                                log.created_at
                              )}
                            </td>

                            <td>
                              <strong>
                                {log.user_name}
                              </strong>

                              <small>
                                {log.user_email}
                              </small>
                            </td>

                            <td>
                              <span className="admin-action-badge">
                                {log.action}
                              </span>
                            </td>

                            <td>
                              {log.entity_type ||
                                "—"}

                              {log.entity_id && (
                                <small>
                                  #{log.entity_id}
                                </small>
                              )}
                            </td>

                            <td>
                              {formatLogDetails(
                                log.details
                              )}
                            </td>

                          </tr>
                        );
                      })
                    )}

                  </tbody>

                </table>
              </div>

            </section>
          </>
        )}

      </div>

      {/* ==============================
          CREATE EDITOR MODAL
      ============================== */}

      {showCreateEditor && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowCreateEditor(false);
            }
          }}
        >
          <div className="admin-modal">

            <div className="admin-modal-header">
              <div>
                <p className="admin-section-eyebrow">
                  Staff
                </p>

                <h2>
                  Create Editor
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateEditor(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateEditor}
              className="admin-form"
            >

              <label>
                Name

                <input
                  type="text"
                  value={editorForm.name}
                  onChange={(event) =>
                    setEditorForm({
                      ...editorForm,
                      name: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Email

                <input
                  type="email"
                  value={editorForm.email}
                  onChange={(event) =>
                    setEditorForm({
                      ...editorForm,
                      email: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Password

                <input
                  type="password"
                  value={editorForm.password}
                  onChange={(event) =>
                    setEditorForm({
                      ...editorForm,
                      password:
                        event.target.value,
                    })
                  }
                  minLength={8}
                  required
                />
              </label>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={
                  actionLoading ===
                  "create-editor"
                }
              >
                <Check size={17} />

                {actionLoading ===
                "create-editor"
                  ? "Creating..."
                  : "Create Editor"}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* ==============================
          RESET PASSWORD MODAL
      ============================== */}

      {showResetPassword && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowResetPassword(null);
            }
          }}
        >
          <div className="admin-modal">

            <div className="admin-modal-header">
              <div>
                <p className="admin-section-eyebrow">
                  Security
                </p>

                <h2>
                  Reset Password
                </h2>

                <p>
                  {showResetPassword.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowResetPassword(null)
                }
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleResetPassword}
              className="admin-form"
            >

              <label>
                New Password

                <input
                  type="password"
                  value={resetPassword}
                  onChange={(event) =>
                    setResetPassword(
                      event.target.value
                    )
                  }
                  minLength={8}
                  required
                />
              </label>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={
                  actionLoading ===
                  `reset-${showResetPassword.id}`
                }
              >
                <KeyRound size={17} />

                {actionLoading ===
                `reset-${showResetPassword.id}`
                  ? "Resetting..."
                  : "Reset Password"}
              </button>

            </form>

          </div>
        </div>
      )}

    </main>
  );
}

export default Admin;
