export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

export const PoseValidator = {
  validateFrontPose(landmarks: any[]): ValidationResult {
    const issues: string[] = [];
    if (!landmarks || landmarks.length === 0) {
      return { isValid: false, issues: ["No person detected"] };
    }

    // Key landmark indices
    const L_SHOULDER = 11;
    const R_SHOULDER = 12;
    const L_WRIST = 15;
    const R_WRIST = 16;
    const L_HIP = 23;
    const R_HIP = 24;
    const L_KNEE = 25;
    const R_KNEE = 26;
    const L_ANKLE = 27;
    const R_ANKLE = 28;

    const keyJoints = [
      L_SHOULDER, R_SHOULDER,
      L_WRIST, R_WRIST,
      L_HIP, R_HIP,
      L_KNEE, R_KNEE,
      L_ANKLE, R_ANKLE
    ];

    // 1. Entire body visibility check
    const MIN_VISIBILITY = 0.55;
    const missingJoints = keyJoints.filter(idx => {
      const landmark = landmarks[idx];
      return !landmark || (landmark.visibility ?? 0) < MIN_VISIBILITY;
    });

    if (missingJoints.length > 0) {
      issues.push("Entire body not visible. Step back fully.");
      return { isValid: false, issues };
    }

    const lSh = landmarks[L_SHOULDER];
    const rSh = landmarks[R_SHOULDER];
    const lWrist = landmarks[L_WRIST];
    const rWrist = landmarks[R_WRIST];
    const lHip = landmarks[L_HIP];
    const rHip = landmarks[R_HIP];
    const lAnk = landmarks[L_ANKLE];
    const rAnk = landmarks[R_ANKLE];

    // 2. User Centered in Frame
    const midHipX = (lHip.x + rHip.x) / 2;
    if (midHipX < 0.40 || midHipX > 0.60) {
      issues.push("Center your body in the frame.");
    }

    // 3. Camera Level (Not Tilted)
    const shoulderTilt = Math.abs(lSh.y - rSh.y);
    const hipTilt = Math.abs(lHip.y - rHip.y);
    if (shoulderTilt > 0.05 || hipTilt > 0.05) {
      issues.push("Keep the camera level (do not tilt).");
    }

    // 4. User Standing Straight
    const midShoulderX = (lSh.x + rSh.x) / 2;
    const midAnkleX = (lAnk.x + rAnk.x) / 2;
    // Check vertical alignment
    if (Math.abs(midShoulderX - midHipX) > 0.07 || Math.abs(midHipX - midAnkleX) > 0.07) {
      issues.push("Stand straight and face the camera.");
    }

    // 5. Arms slightly away from body
    // Wrists x coordinates should be clearly outside/separated from hips x coordinates
    // In normalized coords, x goes from 0 (left of frame) to 1 (right of frame)
    // Left wrist is L_WRIST (idx 15). Right wrist is R_WRIST (idx 16)
    // Left hip is L_HIP (idx 23), Right hip is R_HIP (idx 24)
    // For a person facing the camera:
    // Right side of body is left side of frame (smaller x), Left side of body is right side of frame (larger x)
    // So right wrist x should be less than right hip x, left wrist x should be greater than left hip x.
    const rSeparation = rHip.x - rWrist.x;
    const lSeparation = lWrist.x - lHip.x;

    if (rSeparation < 0.035 || lSeparation < 0.035) {
      issues.push("Keep arms slightly away from your sides.");
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  },

  validateSidePose(landmarks: any[]): ValidationResult {
    const issues: string[] = [];
    if (!landmarks || landmarks.length === 0) {
      return { isValid: false, issues: ["No person detected"] };
    }

    // Key landmark indices for profile view
    const L_SHOULDER = 11;
    const R_SHOULDER = 12;
    const L_HIP = 23;
    const R_HIP = 24;
    const L_KNEE = 25;
    const R_KNEE = 26;
    const L_ANKLE = 27;
    const R_ANKLE = 28;

    // In side profile, at least one set (left or right side) should be highly visible
    const MIN_VISIBILITY = 0.55;
    
    const leftSideVisible = 
      (landmarks[L_SHOULDER]?.visibility ?? 0) > MIN_VISIBILITY &&
      (landmarks[L_HIP]?.visibility ?? 0) > MIN_VISIBILITY &&
      (landmarks[L_KNEE]?.visibility ?? 0) > MIN_VISIBILITY &&
      (landmarks[L_ANKLE]?.visibility ?? 0) > MIN_VISIBILITY;

    const rightSideVisible = 
      (landmarks[R_SHOULDER]?.visibility ?? 0) > MIN_VISIBILITY &&
      (landmarks[R_HIP]?.visibility ?? 0) > MIN_VISIBILITY &&
      (landmarks[R_KNEE]?.visibility ?? 0) > MIN_VISIBILITY &&
      (landmarks[R_ANKLE]?.visibility ?? 0) > MIN_VISIBILITY;

    if (!leftSideVisible && !rightSideVisible) {
      issues.push("Entire body profile not visible. Step back.");
      return { isValid: false, issues };
    }

    // Determine which side is facing the camera
    const isLeftSide = leftSideVisible;
    const sh = isLeftSide ? landmarks[L_SHOULDER] : landmarks[R_SHOULDER];
    const hip = isLeftSide ? landmarks[L_HIP] : landmarks[R_HIP];
    const ank = isLeftSide ? landmarks[L_ANKLE] : landmarks[R_ANKLE];

    // 1. Centered in Frame
    if (hip.x < 0.38 || hip.x > 0.62) {
      issues.push("Center your body in the frame.");
    }

    // 2. Profile Overlap (Shopper is turned sideways)
    // The width of the shoulders in side view should be small compared to front view
    const lSh = landmarks[L_SHOULDER];
    const rSh = landmarks[R_SHOULDER];
    const lHip = landmarks[L_HIP];
    const rHip = landmarks[R_HIP];
    const shoulderWidth = Math.abs(lSh.x - rSh.x);
    const hipWidth = Math.abs(lHip.x - rHip.x);

    if (shoulderWidth > 0.15 || hipWidth > 0.15) {
      issues.push("Turn fully sideways to the camera.");
    }

    // 3. Straight Alignment
    if (Math.abs(sh.x - hip.x) > 0.08 || Math.abs(hip.x - ank.x) > 0.08) {
      issues.push("Stand straight with neutral posture.");
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
};
