
export function validateTemplateVariables(template: { [key: string]: string | number }, variables: Record<string, string | number>) {
  const requiredVariables = [
    'policy_number',
    'issue_date',
    'effective_date',
    'expiration_date',
    'policy_status',
    'annual_premium',
    'payment_frequency',
    'policyholder_name',
    'policyholder_address',
    'policyholder_city_state_zip',
    'policyholder_phone',
    'policyholder_email',
    'policyholder_dob'
  ];

  const missingVariables = requiredVariables.filter(v => !variables[v]);
  
  if (missingVariables.length > 0) {
    throw new Error(`Missing required variables: ${missingVariables.join(', ')}`);
  }

  return true;
}