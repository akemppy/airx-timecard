import sql from "mssql";
import { prisma } from "./db";

function getFoundationConfig(): sql.config {
  return {
    server: process.env.FOUNDATION_HOST || "",
    port: parseInt(process.env.FOUNDATION_PORT || "9000"),
    user: process.env.FOUNDATION_USER || "",
    password: process.env.FOUNDATION_PASSWORD || "",
    database: process.env.FOUNDATION_DATABASE || "",
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
    requestTimeout: 30000,
    connectionTimeout: 15000,
  };
}

export async function discoverSchema(): Promise<string> {
  const pool = await sql.connect(getFoundationConfig());
  try {
    const databases = await pool.request().query(`
      SELECT name FROM sys.databases
      WHERE name NOT IN ('master','tempdb','model','msdb')
      ORDER BY name
    `);

    const tables = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND (TABLE_NAME LIKE '%timecard%'
        OR TABLE_NAME LIKE '%job%'
        OR TABLE_NAME LIKE '%cost%'
        OR TABLE_NAME LIKE '%employee%'
        OR TABLE_NAME LIKE '%budget%'
        OR TABLE_NAME LIKE '%payroll%'
        OR TABLE_NAME LIKE '%pr_%'
        OR TABLE_NAME LIKE '%his_%')
      ORDER BY TABLE_NAME
    `);

    let report = "# Foundation Schema Discovery\n\n";
    report += "## Databases\n";
    for (const row of databases.recordset) {
      report += `- ${row.name}\n`;
    }
    report += "\n## Relevant Tables\n";
    for (const row of tables.recordset) {
      report += `- ${row.TABLE_SCHEMA}.${row.TABLE_NAME}\n`;
    }

    return report;
  } finally {
    await pool.close();
  }
}

export async function syncJobs(): Promise<{ synced: number; errors: string[] }> {
  const config = getFoundationConfig();
  if (!config.server || !config.database) {
    return { synced: 0, errors: ["Foundation connection not configured"] };
  }

  // Placeholder: actual queries depend on schema discovery
  // This will be updated once foundation-schema.md is populated
  const pool = await sql.connect(config);
  const errors: string[] = [];
  let synced = 0;

  try {
    // Example query - adjust table/column names after schema discovery
    const result = await pool.request().query(`
      SELECT TOP 100 * FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);

    // Log what we found for now
    console.log(`Foundation: found ${result.recordset.length} tables`);
    synced = result.recordset.length;
  } catch (err) {
    errors.push(`Foundation sync error: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await pool.close();
  }

  return { synced, errors };
}

export async function syncCostCodes(): Promise<{ synced: number; errors: string[] }> {
  // Check if cost codes already exist
  const existingCount = await prisma.costCode.count();

  if (existingCount > 0) {
    return { synced: 0, errors: [] };
  }

  const codes = [
    { code: "2301", description: "General Conditions", category: "hvac" as const },
    { code: "2302", description: "Demo", category: "hvac" as const },
    { code: "2303", description: "Design/Engineering", category: "hvac" as const },
    { code: "2304", description: "Coordination", category: "hvac" as const },
    { code: "2305", description: "Rentals", category: "hvac" as const },
    { code: "2308", description: "Start-up & Commissioning", category: "hvac" as const },
    { code: "2310", description: "Hangers and Supports", category: "hvac" as const },
    { code: "2311", description: "Underground", category: "hvac" as const },
    { code: "2320", description: "Specialty Piping", category: "hvac" as const },
    { code: "2321", description: "Hydronics Piping", category: "hvac" as const },
    { code: "2322", description: "Condensate Piping", category: "hvac" as const },
    { code: "2323", description: "Refrigeration Piping", category: "hvac" as const },
    { code: "2325", description: "Gas Piping", category: "hvac" as const },
    { code: "2327", description: "Flue Piping", category: "hvac" as const },
    { code: "2331", description: "Ductwork", category: "hvac" as const },
    { code: "2332", description: "Specialty Duct", category: "hvac" as const },
    { code: "2337", description: "GRDs/Flex", category: "hvac" as const },
    { code: "2354", description: "Seismic", category: "hvac" as const },
    { code: "2359", description: "TAB", category: "hvac" as const },
    { code: "2360", description: "Equipment", category: "hvac" as const },
    { code: "2370", description: "Insulation", category: "hvac" as const },
    { code: "2390", description: "Controls", category: "hvac" as const },
    { code: "5500", description: "WA Drive Time (PW)", category: "drive_time" as const },
    { code: "5555", description: "Drive Time (OR)", category: "drive_time" as const },
    { code: "5599", description: "WA Drive Time (non-PW)", category: "drive_time" as const },
    { code: "0100", description: "General Conditions (GC)", category: "general" as const },
    { code: "0200", description: "Demo (GC)", category: "general" as const },
    { code: "0300", description: "Concrete", category: "general" as const },
    { code: "0500", description: "Metals", category: "general" as const },
    { code: "2100", description: "Fire Suppression", category: "general" as const },
    { code: "2200", description: "Plumbing", category: "general" as const },
    { code: "2600", description: "Electrical", category: "general" as const },
    { code: "5080", description: "Field Phone", category: "gl" as const },
    { code: "5710", description: "Shipping", category: "gl" as const },
    { code: "5810", description: "Lodging", category: "gl" as const },
    { code: "6130", description: "Small Tools", category: "gl" as const },
    { code: "6210", description: "Safety", category: "gl" as const },
    { code: "7120", description: "Vehicle Fuel", category: "gl" as const },
  ];

  let synced = 0;

  for (const c of codes) {
    // Check if code already exists
    const existing = await prisma.costCode.findUnique({
      where: { code: c.code },
    });

    if (existing) {
      // Update
      await prisma.costCode.update({
        where: { code: c.code },
        data: {
          description: c.description,
          category: c.category,
        },
      });
    } else {
      // Create
      await prisma.costCode.create({
        data: {
          code: c.code,
          description: c.description,
          category: c.category,
          acceptsLabor: true,
          acceptsMaterial: false,
          acceptsSub: false,
          isActive: true,
        },
      });
    }
    synced++;
  }

  return { synced, errors: [] };
}
