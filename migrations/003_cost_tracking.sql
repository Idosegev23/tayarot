-- Cost Tracking Infrastructure
-- Tracks AI API usage and estimated costs

-- Cost tracking table
CREATE TABLE IF NOT EXISTS cost_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service TEXT NOT NULL, -- 'openai' | 'gemini'
  tokens_used INTEGER,
  images_generated INTEGER,
  estimated_cost DECIMAL(10,4) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cost_service ON cost_tracking(service, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cost_timestamp ON cost_tracking(timestamp DESC);

-- RLS Policy
ALTER TABLE cost_tracking ENABLE ROW LEVEL SECURITY;

-- Allow all operations for demo (in production, restrict this)
CREATE POLICY "Enable all for cost_tracking" 
ON cost_tracking FOR ALL 
USING (true) 
WITH CHECK (true);

-- Function to get cost summary by service
CREATE OR REPLACE FUNCTION get_cost_summary(
  time_window INTERVAL DEFAULT '1 day'::interval
)
RETURNS TABLE (
  service TEXT,
  total_requests BIGINT,
  total_tokens BIGINT,
  total_images BIGINT,
  total_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.service,
    COUNT(*) as total_requests,
    COALESCE(SUM(ct.tokens_used), 0) as total_tokens,
    COALESCE(SUM(ct.images_generated), 0) as total_images,
    COALESCE(SUM(ct.estimated_cost), 0) as total_cost
  FROM cost_tracking ct
  WHERE ct.timestamp > NOW() - time_window
  GROUP BY ct.service
  ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old cost tracking data (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_cost_tracking()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cost_tracking
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON TABLE cost_tracking IS 'Tracks AI API usage and estimated costs for budget monitoring';
COMMENT ON FUNCTION get_cost_summary IS 'Get cost summary by service for a given time window';
COMMENT ON FUNCTION cleanup_old_cost_tracking IS 'Remove cost tracking data older than 90 days';
