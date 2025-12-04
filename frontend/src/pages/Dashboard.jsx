import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Title,
  Text,
  Metric,
  Flex,
  Grid,
  Col,
  Badge,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  ProgressBar,
  List,
  ListItem,
} from '@tremor/react';
import api from '../api/client';

function Dashboard() {
  const [runningServers, setRunningServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [monitoringData, setMonitoringData] = useState({
    players: [],
    session: null,
    logs: [],
  });
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    fetchRunningServers();
    const interval = setInterval(fetchRunningServers, 3000);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (selectedServer) {
      fetchMonitoringData();
      const interval = setInterval(fetchMonitoringData, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedServer]);

  const fetchRunningServers = async () => {
    try {
      const statuses = await api.getAllServerStatuses();
      if (isMountedRef.current) {
        const running = statuses.servers.filter((s) => s.running);
        setRunningServers(running);
        if (running.length > 0 && !selectedServer) {
          setSelectedServer(running[0].presetId);
        }
        if (selectedServer && !running.find((s) => s.presetId === selectedServer)) {
          setSelectedServer(running.length > 0 ? running[0].presetId : null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch server statuses:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const fetchMonitoringData = async () => {
    if (!selectedServer) return;
    try {
      const logsData = await api.getServerInstanceLogs(selectedServer, 50);
      const playersData = await api.getPlayers();
      if (isMountedRef.current) {
        setMonitoringData({
          players: playersData.players || [],
          session: playersData.session || null,
          logs: logsData.logs || [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    }
  };

  const handleStopAll = async () => {
    setActionLoading(true);
    try {
      await api.stopAllServerInstances();
      await fetchRunningServers();
    } catch (error) {
      console.error('Failed to stop all servers:', error);
      alert('Failed to stop all servers: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestartAll = async () => {
    if (runningServers.length === 0) {
      alert('No servers are currently running');
      return;
    }
    if (!confirm(`Restart all ${runningServers.length} running server instance(s)?`)) return;
    setActionLoading(true);
    try {
      for (const server of runningServers) {
        await api.restartServerInstance(server.presetId);
      }
      await fetchRunningServers();
      alert(`Successfully restarted ${runningServers.length} server(s)`);
    } catch (error) {
      console.error('Failed to restart all servers:', error);
      alert('Failed to restart all servers: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const selectedServerInfo = runningServers.find((s) => s.presetId === selectedServer);
  const totalPlayers = monitoringData.players.length;
  const maxPlayers = monitoringData.session?.maxPlayers || 18;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-6">
      {/* Header */}
      <div>
        <Title>Dashboard</Title>
        <Text>Monitor and manage your Assetto Corsa servers</Text>
      </div>

      {/* KPI Cards */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        <Card decoration="top" decorationColor="emerald">
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text>Running Servers</Text>
              <Metric>{runningServers.length}</Metric>
            </div>
            <Badge color={runningServers.length > 0 ? 'emerald' : 'gray'} size="xl">
              {runningServers.length > 0 ? 'Online' : 'Offline'}
            </Badge>
          </Flex>
        </Card>

        <Card decoration="top" decorationColor="blue">
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text>Active Drivers</Text>
              <Metric>{totalPlayers}</Metric>
            </div>
            <Badge color={totalPlayers > 0 ? 'blue' : 'gray'} size="xl">
              {totalPlayers > 0 ? 'Connected' : 'Empty'}
            </Badge>
          </Flex>
        </Card>

        <Card decoration="top" decorationColor="amber">
          <div>
            <Text>Server Capacity</Text>
            <Metric>{totalPlayers}/{maxPlayers}</Metric>
          </div>
          <ProgressBar value={(totalPlayers / maxPlayers) * 100} color="amber" className="mt-3" />
        </Card>

        <Card decoration="top" decorationColor="violet">
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text>Session</Text>
              <Metric className="text-2xl">{monitoringData.session?.type || 'None'}</Metric>
            </div>
            {monitoringData.session?.timeRemaining && (
              <Text>{monitoringData.session.timeRemaining}s left</Text>
            )}
          </Flex>
        </Card>
      </Grid>

      {/* Main Content Grid */}
      <Grid numItemsLg={3} className="gap-6">
        {/* Server Selection - Left Column */}
        <Col numColSpanLg={1}>
          <Card className="h-full">
            <Title>Server Instances</Title>
            {runningServers.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-4xl mb-3">🖥️</div>
                <Text>No servers running</Text>
                <Text className="text-sm text-gray-500">Start a server from the Config Editor</Text>
              </div>
            ) : (
              <List className="mt-4">
                {runningServers.map((server) => (
                  <ListItem key={server.presetId}>
                    <button
                      onClick={() => setSelectedServer(server.presetId)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedServer === server.presetId
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Flex justifyContent="between" alignItems="center">
                        <div>
                          <Text className="font-semibold">{server.name || 'Unknown Server'}</Text>
                          <Text className="text-xs">Port: {server.port || 'N/A'}</Text>
                        </div>
                        <Badge color="emerald" size="sm">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Live
                          </span>
                        </Badge>
                      </Flex>
                    </button>
                  </ListItem>
                ))}
              </List>
            )}
          </Card>
        </Col>

        {/* Active Drivers - Center/Right */}
        <Col numColSpanLg={2}>
          <Card className="h-full">
            <Flex justifyContent="between" alignItems="center">
              <div>
                <Title>Active Drivers</Title>
                <Text>{selectedServerInfo?.name || 'Select a server'}</Text>
              </div>
              {totalPlayers > 0 && (
                <Badge color="blue">{totalPlayers} connected</Badge>
              )}
            </Flex>

            {!selectedServer ? (
              <div className="py-12 text-center">
                <div className="text-5xl mb-4">👥</div>
                <Text>Select a running server to view drivers</Text>
              </div>
            ) : monitoringData.players.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-5xl mb-4">🏎️</div>
                <Text className="font-medium">No Active Drivers</Text>
                <Text className="text-sm text-gray-500">Players will appear here when they connect</Text>
              </div>
            ) : (
              <Table className="mt-4">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Driver</TableHeaderCell>
                    <TableHeaderCell>Car</TableHeaderCell>
                    <TableHeaderCell>Position</TableHeaderCell>
                    <TableHeaderCell>Ping</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monitoringData.players.map((player, idx) => (
                    <TableRow key={player.id || idx}>
                      <TableCell>
                        <Text className="font-medium">{player.name || 'Unknown'}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>{player.carName || player.carModel || player.car || 'N/A'}</Text>
                      </TableCell>
                      <TableCell>
                        <Badge color={idx === 0 ? 'amber' : 'gray'}>P{player.position || idx + 1}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge color={player.ping < 50 ? 'emerald' : player.ping < 100 ? 'amber' : 'red'}>
                          {player.ping || '--'}ms
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </Col>
      </Grid>

      {/* Live Timing & Session Info */}
      {selectedServer && (
        <Grid numItemsLg={2} className="gap-6">
          {/* Live Timing */}
          <Card>
            <Title>Live Timing</Title>
            {monitoringData.players.length === 0 ? (
              <div className="py-8 text-center">
                <Text className="text-gray-500">No timing data available</Text>
              </div>
            ) : (
              <Table className="mt-4">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Pos</TableHeaderCell>
                    <TableHeaderCell>Driver</TableHeaderCell>
                    <TableHeaderCell>Best Lap</TableHeaderCell>
                    <TableHeaderCell>Last Lap</TableHeaderCell>
                    <TableHeaderCell>Gap</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monitoringData.players.map((player, idx) => (
                    <TableRow key={player.id || idx}>
                      <TableCell>
                        <Badge color={idx === 0 ? 'amber' : idx === 1 ? 'gray' : idx === 2 ? 'orange' : 'slate'}>
                          {idx + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Text className="font-medium">{player.name || 'Unknown'}</Text>
                      </TableCell>
                      <TableCell><Text>--:--:---</Text></TableCell>
                      <TableCell><Text>--:--:---</Text></TableCell>
                      <TableCell><Text>--:--</Text></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* Session Details */}
          <Card>
            <Title>Session Details</Title>
            {monitoringData.session ? (
              <div className="mt-4 space-y-4">
                <Flex justifyContent="between">
                  <Text>Session Type</Text>
                  <Badge color="blue">{monitoringData.session.type}</Badge>
                </Flex>
                <Flex justifyContent="between">
                  <Text>Track</Text>
                  <Text className="font-medium">{monitoringData.session.trackName || monitoringData.session.track || 'N/A'}</Text>
                </Flex>
                <Flex justifyContent="between">
                  <Text>Players</Text>
                  <Text className="font-medium">{monitoringData.session.currentPlayers || totalPlayers}/{monitoringData.session.maxPlayers || maxPlayers}</Text>
                </Flex>
                <Flex justifyContent="between">
                  <Text>Time Remaining</Text>
                  <Text className="font-medium">{monitoringData.session.timeRemaining || '--'}s</Text>
                </Flex>
                {monitoringData.session.laps && (
                  <Flex justifyContent="between">
                    <Text>Laps</Text>
                    <Text className="font-medium">{monitoringData.session.laps}</Text>
                  </Flex>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Text className="text-gray-500">No session data available</Text>
              </div>
            )}
          </Card>
        </Grid>
      )}

      {/* Server Logs */}
      {selectedServer && (
        <Card>
          <Title>Server Logs</Title>
          <Text>{selectedServerInfo?.name}</Text>
          <div className="mt-4 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-48 overflow-y-auto">
            {monitoringData.logs.length === 0 ? (
              <span className="text-gray-500">No logs available</span>
            ) : (
              monitoringData.logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed hover:bg-gray-800 px-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Fixed Bottom Controls */}
      <div className="fixed bottom-0 left-64 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700 shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleRestartAll}
              disabled={actionLoading || runningServers.length === 0}
              className="px-6 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Restart All
            </button>
            <button
              onClick={handleStopAll}
              disabled={actionLoading || runningServers.length === 0}
              className="px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Stop All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
