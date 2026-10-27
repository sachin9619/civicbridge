-- ============================================
-- SEED DATA (Demo/Development Only)
-- ============================================

-- Departments
INSERT INTO departments (id, name, description, head_name, contact_email) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Sanitation', 'Garbage collection, waste management, and cleanliness', 'Dr. Priya Sharma', 'sanitation@civicbridge.demo'),
  ('d1000000-0000-0000-0000-000000000002', 'Roads and Public Works', 'Road maintenance, potholes, footpath repairs', 'Rajesh Kumar', 'roads@civicbridge.demo'),
  ('d1000000-0000-0000-0000-000000000003', 'Electrical Maintenance', 'Street lighting, public electrical infrastructure', 'Anita Desai', 'electrical@civicbridge.demo'),
  ('d1000000-0000-0000-0000-000000000004', 'Water Supply', 'Water distribution, pipe maintenance, quality control', 'Vikram Singh', 'water@civicbridge.demo'),
  ('d1000000-0000-0000-0000-000000000005', 'Drainage', 'Drainage systems, sewage management, flood control', 'Meera Patel', 'drainage@civicbridge.demo'),
  ('d1000000-0000-0000-0000-000000000006', 'Safety Cell', 'Sensitive safety complaints — restricted access', 'Constable Deepa Rao', 'safety@civicbridge.demo');

-- Wards
INSERT INTO wards (id, name, ward_number, area_description) VALUES
  ('w1000000-0000-0000-0000-000000000001', 'Central Ward', 1, 'City center, main market area, government offices'),
  ('w1000000-0000-0000-0000-000000000002', 'North Ward', 2, 'Residential area north of the river, schools, parks'),
  ('w1000000-0000-0000-0000-000000000003', 'South Ward', 3, 'Industrial zone, commercial district, hospital area'),
  ('w1000000-0000-0000-0000-000000000004', 'East Ward', 4, 'New development area, IT park, residential colonies'),
  ('w1000000-0000-0000-0000-000000000005', 'West Ward', 5, 'Old city, heritage area, temple district');
