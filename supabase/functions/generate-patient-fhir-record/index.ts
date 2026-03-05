import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Helper function to format doctor names and avoid duplicate "Dr." prefix
function formatDoctorName(name: string | undefined | null): string {
  if (!name) {
    return 'N/A';
  }
  const trimmedName = name.trim();
  if (trimmedName.startsWith('Dr.')) {
    return trimmedName.replace(/^Dr\.\s*/, 'Dr. ');
  }
  return `Dr. ${trimmedName}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const patientId = url.searchParams.get("patient_id");

    if (!patientId) {
      return new Response(
        JSON.stringify({ error: "patient_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select(`
        *,
        primary_care_physician:medical_staff!primary_care_physician_id(
          id,
          license_number,
          specialization,
          user_profile:user_profiles(
            full_name,
            phone
          )
        )
      `)
      .eq("id", patientId)
      .single();

    if (patientError || !patient) {
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: insIdentity } = await supabase
      .from("patient_ins_identity")
      .select("*")
      .eq("patient_id", patientId)
      .maybeSingle();

    const { data: medicalHistory } = await supabase
      .from("patient_medical_history")
      .select(`
        *,
        recorded_by_user:user_profiles!recorded_by(full_name)
      `)
      .eq("patient_id", patientId)
      .order("diagnosis_date", { ascending: false });

    const { data: familyHistory } = await supabase
      .from("patient_family_history")
      .select("*")
      .eq("patient_id", patientId);

    const { data: allergies } = await supabase
      .from("patient_allergies_detailed")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "actif");

    const { data: riskFactors } = await supabase
      .from("patient_risk_factors")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "actif");

    const { data: consents } = await supabase
      .from("patient_consents")
      .select("*")
      .eq("patient_id", patientId);

    const { data: advanceDirectives } = await supabase
      .from("patient_advance_directives")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "actif");

    const { data: consultations } = await supabase
      .from("consultations")
      .select(`
        *,
        doctor:medical_staff!doctor_id(
          license_number,
          specialization,
          user_profile:user_profiles(full_name)
        )
      `)
      .eq("patient_id", patientId)
      .order("consultation_date", { ascending: false })
      .limit(20);

    const { data: hospitalizations } = await supabase
      .from("patient_hospitalizations_history")
      .select("*")
      .eq("patient_id", patientId)
      .order("admission_date", { ascending: false });

    const fhirBundle = {
      resourceType: "Bundle",
      type: "collection",
      timestamp: new Date().toISOString(),
      meta: {
        lastUpdated: new Date().toISOString(),
        source: "Okapia Hospital Management System",
        profile: ["http://hl7.org/fhir/StructureDefinition/Bundle"],
      },
      entry: [
        {
          fullUrl: `urn:uuid:${patient.id}`,
          resource: {
            resourceType: "Patient",
            id: patient.id,
            meta: {
              lastUpdated: patient.updated_at,
              profile: ["http://interopsante.org/fhir/StructureDefinition/FrPatient"],
            },
            identifier: [
              {
                system: "urn:oid:hospital-internal",
                value: patient.patient_number,
                use: "official",
              },
              ...(insIdentity?.ins_number ? [
                {
                  system: "urn:oid:1.2.250.1.213.1.4.8",
                  value: insIdentity.ins_number,
                  use: "official",
                  type: {
                    coding: [{
                      system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                      code: "INS-C",
                      display: "Identifiant National de Santé",
                    }],
                  },
                },
              ] : []),
            ],
            active: true,
            name: [{
              use: "official",
              family: patient.last_name,
              given: [patient.first_name],
            }],
            telecom: [
              ...(patient.phone ? [{
                system: "phone",
                value: patient.phone,
                use: "mobile",
              }] : []),
              ...(patient.email ? [{
                system: "email",
                value: patient.email,
              }] : []),
            ],
            gender: patient.gender === "male" ? "male" : "female",
            birthDate: patient.date_of_birth,
            address: patient.address ? [{
              use: "home",
              text: patient.address,
              city: patient.city,
            }] : [],
            contact: patient.emergency_contact_name ? [{
              relationship: [{
                coding: [{
                  system: "http://terminology.hl7.org/CodeSystem/v2-0131",
                  code: "C",
                  display: "Emergency Contact",
                }],
              }],
              name: {
                text: patient.emergency_contact_name,
              },
              telecom: patient.emergency_contact_phone ? [{
                system: "phone",
                value: patient.emergency_contact_phone,
              }] : [],
            }] : [],
            generalPractitioner: patient.primary_care_physician ? [{
              reference: `Practitioner/${patient.primary_care_physician.id}`,
              display: formatDoctorName(patient.primary_care_physician.user_profile?.full_name),
            }] : [],
          },
        },
        ...(medicalHistory?.map((condition) => ({
          fullUrl: `urn:uuid:${condition.id}`,
          resource: {
            resourceType: "Condition",
            id: condition.id,
            meta: {
              lastUpdated: condition.updated_at,
            },
            clinicalStatus: {
              coding: [{
                system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
                code: condition.status === "actif" ? "active" : condition.status === "résolu" ? "resolved" : "recurrence",
              }],
            },
            verificationStatus: {
              coding: [{
                system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                code: "confirmed",
              }],
            },
            category: [{
              coding: [{
                system: "http://terminology.hl7.org/CodeSystem/condition-category",
                code: "encounter-diagnosis",
              }],
            }],
            severity: condition.severity ? {
              coding: [{
                system: "http://snomed.info/sct",
                code: condition.severity === "léger" ? "255604002" : condition.severity === "modéré" ? "6736007" : "24484000",
                display: condition.severity,
              }],
            } : undefined,
            code: {
              coding: [
                ...(condition.icd10_code ? [{
                  system: "http://hl7.org/fhir/sid/icd-10",
                  code: condition.icd10_code,
                  display: condition.condition_name,
                }] : []),
                ...(condition.snomed_code ? [{
                  system: "http://snomed.info/sct",
                  code: condition.snomed_code,
                  display: condition.condition_name,
                }] : []),
              ],
              text: condition.condition_name,
            },
            subject: {
              reference: `Patient/${patient.id}`,
            },
            onsetDateTime: condition.diagnosis_date,
            abatementDateTime: condition.resolution_date,
            note: condition.clinical_notes ? [{
              text: condition.clinical_notes,
            }] : [],
          },
        })) || []),
        ...(allergies?.map((allergy) => ({
          fullUrl: `urn:uuid:${allergy.id}`,
          resource: {
            resourceType: "AllergyIntolerance",
            id: allergy.id,
            meta: {
              lastUpdated: allergy.updated_at,
            },
            clinicalStatus: {
              coding: [{
                system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                code: allergy.status === "actif" ? "active" : "resolved",
              }],
            },
            verificationStatus: {
              coding: [{
                system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
                code: allergy.status === "confirmé" ? "confirmed" : "unconfirmed",
              }],
            },
            type: "allergy",
            category: [allergy.allergy_type === "médicament" ? "medication" : allergy.allergy_type === "aliment" ? "food" : "environment"],
            criticality: allergy.severity === "anaphylaxie" ? "high" : allergy.severity === "sévère" ? "high" : "low",
            code: {
              coding: allergy.snomed_code ? [{
                system: "http://snomed.info/sct",
                code: allergy.snomed_code,
                display: allergy.allergen_name,
              }] : [],
              text: allergy.allergen_name,
            },
            patient: {
              reference: `Patient/${patient.id}`,
            },
            onsetDateTime: allergy.first_occurrence_date,
            reaction: allergy.reaction_description ? [{
              manifestation: [{
                text: allergy.reaction_description,
              }],
              severity: allergy.severity === "légère" ? "mild" : allergy.severity === "modérée" ? "moderate" : "severe",
            }] : [],
          },
        })) || []),
        ...(consultations?.map((consultation) => ({
          fullUrl: `urn:uuid:${consultation.id}`,
          resource: {
            resourceType: "Encounter",
            id: consultation.id,
            meta: {
              lastUpdated: consultation.updated_at,
            },
            status: "finished",
            class: {
              system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
              code: "AMB",
              display: "ambulatory",
            },
            subject: {
              reference: `Patient/${patient.id}`,
            },
            participant: consultation.doctor ? [{
              individual: {
                reference: `Practitioner/${consultation.doctor.id}`,
                display: formatDoctorName(consultation.doctor.user_profile?.full_name),
              },
            }] : [],
            period: {
              start: consultation.consultation_date,
            },
            reasonCode: consultation.chief_complaint ? [{
              text: consultation.chief_complaint,
            }] : [],
            diagnosis: consultation.diagnosis ? [{
              condition: {
                display: consultation.diagnosis,
              },
              use: {
                coding: [{
                  system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
                  code: "DD",
                  display: "Discharge diagnosis",
                }],
              },
            }] : [],
          },
        })) || []),
      ],
    };

    await supabase.from("patient_data_access_log").insert({
      patient_id: patientId,
      user_id: req.headers.get("x-user-id") || "system",
      access_type: "export",
      accessed_sections: ["fhir_bundle"],
      access_reason: "FHIR Bundle Export",
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
    });

    return new Response(
      JSON.stringify(fhirBundle, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/fhir+json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating FHIR record:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});