-- Rate Limiting Infrastructure
-- Creates tables and functions for tracking rate limits

-- Rate limit logs table
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service TEXT NOT NULL, -- 'openai' | 'gemini' | 'upload'
  identifier TEXT NOT NULL, -- IP address or client identifier
  allowed BOOLEAN NOT NULL, -- Was the request allowed?
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_service ON rate_limit_logs(service, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_logs(identifier, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_timestamp ON rate_limit_logs(timestamp DESC);

-- RLS Policy
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for demo (in production, restrict this)
CREATE POLICY "Enable all for rate_limit_logs" 
ON rate_limit_logs FOR ALL 
USING (true) 
WITH CHECK (true);

-- Function to get rate limit stats
CREATE OR REPLACE FUNCTION get_rate_limit_stats(
  time_window INTERVAL DEFAULT '1 hour'::interval
)
RETURNS TABLE (
  service TEXT,
  total_requests BIGINT,
  blocked_requests BIGINT,
  unique_clients BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rl.service,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE NOT rl.allowed) as blocked_requests,
    COUNT(DISTINCT rl.identifier) as unique_clients
  FROM rate_limit_logs rl
  WHERE rl.timestamp > NOW() - time_window
  GROUP BY rl.service
  ORDER BY total_requests DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old rate limit logs (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limit_logs
  WHERE timestamp < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON TABLE rate_limit_logs IS 'Tracks rate limiting events for monitoring and abuse prevention';
COMMENT ON FUNCTION get_rate_limit_stats IS 'Get rate limiting statistics for a given time window';
COMMENT ON FUNCTION cleanup_old_rate_limit_logs IS 'Remove rate limit logs older than 7 days';
